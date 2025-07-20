# ============================================================================
# backend/events/utils.py
# ============================================================================
"""
Utilitaires pour les événements
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import uuid


def generer_fichier_ics(event):
    """Génère un fichier ICS pour un événement"""
    ics_template = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Plateforme Femmes en Politique//Event Calendar//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:{uid}
DTSTART:{date_debut}
DTEND:{date_fin}
SUMMARY:{titre}
DESCRIPTION:{description}
LOCATION:{lieu}
ORGANIZER:CN={organisateur}
STATUS:CONFIRMED
SEQUENCE:0
CREATED:{date_creation}
LAST-MODIFIED:{date_modification}
END:VEVENT
END:VCALENDAR"""
    
    def format_datetime(dt):
        """Formate une datetime pour ICS"""
        return dt.strftime('%Y%m%dT%H%M%SZ')
    
    return ics_template.format(
        uid=str(event.id),
        date_debut=format_datetime(event.date_debut),
        date_fin=format_datetime(event.date_fin),
        titre=event.titre.replace('\n', '\\n'),
        description=event.description.replace('\n', '\\n'),
        lieu=event.lieu if not event.est_en_ligne else event.lien_visioconference,
        organisateur=event.organisateur.get_full_name(),
        date_creation=format_datetime(event.date_creation),
        date_modification=format_datetime(event.date_modification)
    )


def envoyer_confirmation_inscription(inscription):
    """Envoie un email de confirmation d'inscription"""
    try:
        context = {
            'inscription': inscription,
            'event': inscription.event,
            'participante': inscription.participante,
        }
        
        sujet = f"Confirmation d'inscription - {inscription.event.titre}"
        
        # Email HTML
        html_message = render_to_string('events/emails/confirmation_inscription.html', context)
        
        # Email texte (fallback)
        plain_message = render_to_string('events/emails/confirmation_inscription.txt', context)
        
        send_mail(
            subject=sujet,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[inscription.participante.email],
            fail_silently=False
        )
        
        return True
    except Exception as e:
        # Logger l'erreur
        import logging
        logger = logging.getLogger('events')
        logger.error(f"Erreur envoi email confirmation: {e}")
        return False


def envoyer_rappel_event(rappel):
    """Envoie un rappel d'événement"""
    try:
        if rappel.type_rappel == 'email':
            context = {
                'rappel': rappel,
                'event': rappel.event,
                'participante': rappel.destinataire,
            }
            
            sujet = rappel.objet_personnalise or f"Rappel - {rappel.event.titre}"
            
            if rappel.message_personnalise:
                message = rappel.message_personnalise
            else:
                message = render_to_string('events/emails/rappel_event.txt', context)
            
            send_mail(
                subject=sujet,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[rappel.destinataire.email],
                fail_silently=False
            )
        
        # Marquer comme envoyé
        rappel.statut = 'envoye'
        rappel.date_envoi = timezone.now()
        rappel.save()
        
        return True
    except Exception as e:
        # Marquer comme échec
        rappel.statut = 'echec'
        rappel.erreur_envoi = str(e)
        rappel.save()
        return False


def planifier_rappels_automatiques(event):
    """Planifie les rappels automatiques pour un événement"""
    from .models import RappelEvent, InscriptionEvent
    
    if not event.rappels_automatiques:
        return
    
    # Récupérer tous les participants confirmés
    inscriptions = InscriptionEvent.objects.filter(
        event=event,
        statut='confirmee'
    )
    
    for inscription in inscriptions:
        for heures_avant in event.rappels_automatiques:
            date_programmee = event.date_debut - timedelta(hours=heures_avant)
            
            # Ne pas créer de rappel dans le passé
            if date_programmee <= timezone.now():
                continue
            
            # Éviter les doublons
            if RappelEvent.objects.filter(
                event=event,
                destinataire=inscription.participante,
                heures_avant=heures_avant
            ).exists():
                continue
            
            RappelEvent.objects.create(
                event=event,
                destinataire=inscription.participante,
                type_rappel='email',
                heures_avant=heures_avant,
                date_programmee=date_programmee
            )


def generer_rapport_participation(event):
    """Génère un rapport de participation pour un événement"""
    if not event.est_passe:
        return None
    
    inscriptions = event.inscriptions.all()
    confirmees = inscriptions.filter(statut='confirmee')
    presentes = inscriptions.filter(statut='presente')
    
    rapport = {
        'event': {
            'titre': event.titre,
            'date': event.date_debut,
            'lieu': event.lieu,
            'organisateur': event.organisateur.get_full_name(),
        },
        'statistiques': {
            'inscriptions_totales': inscriptions.count(),
            'inscriptions_confirmees': confirmees.count(),
            'participants_presents': presentes.count(),
            'taux_participation': (presentes.count() / confirmees.count() * 100) if confirmees.count() > 0 else 0,
            'taux_occupation': (presentes.count() / event.max_participants * 100),
        },
        'evaluations': {
            'nombre': presentes.filter(evaluation_event__isnull=False).count(),
            'note_moyenne': presentes.aggregate(
                avg=models.Avg('evaluation_event')
            )['avg'] or 0,
        },
        'participants': []
    }
    
    for inscription in presentes:
        rapport['participants'].append({
            'nom': inscription.participante.get_full_name(),
            'region': inscription.participante.region,
            'statut': inscription.get_statut_display(),
            'evaluation': inscription.evaluation_event,
            'commentaire': inscription.commentaire_evaluation,
        })
    
    return rapport