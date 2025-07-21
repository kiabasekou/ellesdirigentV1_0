# ============================================================================
# backend/events/tasks.py
# ============================================================================
"""
Tâches asynchrones pour le module événements
Gestion des notifications, rappels et tâches de maintenance
"""
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime, timedelta
import logging

from .models import Event, InscriptionEvent, RappelEvent
from .utils import envoyer_confirmation_inscription, generer_fichier_ics

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def envoyer_rappel_event(self, rappel_id):
    """
    Envoie un rappel d'événement par email
    """
    try:
        rappel = RappelEvent.objects.get(pk=rappel_id)
        
        # Vérifier si le rappel peut être envoyé
        if not rappel.peut_etre_envoye():
            logger.warning(f"Rappel {rappel_id} ne peut pas être envoyé")
            return False
        
        # Préparer le contexte pour l'email
        context = {
            'rappel': rappel,
            'event': rappel.event,
            'participante': rappel.destinataire,
            'heures_avant': rappel.heures_avant,
            'ics_content': generer_fichier_ics(rappel.event)
        }
        
        # Choisir le template selon le type de rappel
        if rappel.type_rappel == 'confirmation':
            subject_template = 'events/emails/confirmation_subject.txt'
            message_template = 'events/emails/confirmation_message.html'
        else:
            subject_template = 'events/emails/rappel_subject.txt'
            message_template = 'events/emails/rappel_message.html'
        
        # Générer le contenu de l'email
        subject = render_to_string(subject_template, context).strip()
        message = render_to_string(message_template, context)
        
        # Utiliser un message personnalisé si défini
        if rappel.message_personnalise:
            message = rappel.message_personnalise.format(**context)
        
        # Envoyer l'email
        send_mail(
            subject=subject,
            message='',  # Version texte vide
            html_message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[rappel.destinataire.email],
            fail_silently=False
        )
        
        # Marquer le rappel comme envoyé
        rappel.statut = 'envoye'
        rappel.date_envoi = timezone.now()
        rappel.save()
        
        logger.info(f"Rappel {rappel_id} envoyé avec succès")
        return True
        
    except RappelEvent.DoesNotExist:
        logger.error(f"Rappel {rappel_id} introuvable")
        return False
    except Exception as exc:
        logger.error(f"Erreur lors de l'envoi du rappel {rappel_id}: {str(exc)}")
        # Réessayer avec délai exponentiel
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def traiter_rappels_automatiques():
    """
    Traite tous les rappels automatiques programmés
    """
    # Récupérer les rappels à envoyer
    rappels_a_envoyer = RappelEvent.objects.filter(
        statut='programme',
        date_programmee__lte=timezone.now()
    ).select_related('event', 'destinataire')
    
    count_envoyes = 0
    count_erreurs = 0
    
    for rappel in rappels_a_envoyer:
        try:
            # Lancer la tâche d'envoi
            envoyer_rappel_event.delay(rappel.id)
            count_envoyes += 1
        except Exception as e:
            logger.error(f"Erreur lors du lancement du rappel {rappel.id}: {str(e)}")
            count_erreurs += 1
    
    logger.info(f"Rappels traités: {count_envoyes} envoyés, {count_erreurs} erreurs")
    return {'envoyes': count_envoyes, 'erreurs': count_erreurs}


@shared_task
def creer_rappels_automatiques():
    """
    Crée automatiquement les rappels pour les événements configurés
    """
    # Événements avec rappels automatiques activés
    events_avec_rappels = Event.objects.filter(
        notifications_activees=True,
        rappels_automatiques__isnull=False,
        date_debut__gt=timezone.now()
    ).exclude(rappels_automatiques=[])
    
    count_crees = 0
    
    for event in events_avec_rappels:
        # Récupérer les inscriptions confirmées
        inscriptions = InscriptionEvent.objects.filter(
            event=event,
            statut__in=['confirmee', 'presente']
        ).select_related('participante')
        
        for inscription in inscriptions:
            for heures_avant in event.rappels_automatiques:
                # Calculer la date de programmation
                date_programmee = event.date_debut - timedelta(hours=heures_avant)
                
                # Ne créer que si la date est dans le futur
                if date_programmee > timezone.now():
                    # Vérifier si le rappel n'existe pas déjà
                    if not RappelEvent.objects.filter(
                        event=event,
                        destinataire=inscription.participante,
                        heures_avant=heures_avant
                    ).exists():
                        RappelEvent.objects.create(
                            event=event,
                            destinataire=inscription.participante,
                            type_rappel='rappel',
                            heures_avant=heures_avant,
                            date_programmee=date_programmee,
                            statut='programme'
                        )
                        count_crees += 1
    
    logger.info(f"Rappels automatiques créés: {count_crees}")
    return count_crees


@shared_task
def mettre_a_jour_statuts_events():
    """
    Met à jour automatiquement les statuts des événements
    """
    now = timezone.now()
    count_updates = 0
    
    # Events qui doivent passer en "en_cours"
    events_a_demarrer = Event.objects.filter(
        statut='ouvert',
        date_debut__lte=now,
        date_fin__gt=now
    )
    
    for event in events_a_demarrer:
        event.statut = 'en_cours'
        event.save()
        count_updates += 1
    
    # Events qui doivent passer en "termine"
    events_a_terminer = Event.objects.filter(
        statut='en_cours',
        date_fin__lte=now
    )
    
    for event in events_a_terminer:
        event.statut = 'termine'
        event.save()
        count_updates += 1
    
    logger.info(f"Statuts d'événements mis à jour: {count_updates}")
    return count_updates


@shared_task
def nettoyer_rappels_expires():
    """
    Nettoie les rappels expirés (plus anciens que 30 jours)
    """
    date_limite = timezone.now() - timedelta(days=30)
    
    # Supprimer les rappels anciens et envoyés
    rappels_expires = RappelEvent.objects.filter(
        statut='envoye',
        date_envoi__lt=date_limite
    )
    
    count_supprimes = rappels_expires.count()
    rappels_expires.delete()
    
    # Marquer comme échués les rappels non envoyés et expirés
    rappels_echus = RappelEvent.objects.filter(
        statut='programme',
        date_programmee__lt=timezone.now() - timedelta(hours=24)
    )
    
    count_echus = rappels_echus.update(statut='echoue')
    
    logger.info(f"Nettoyage rappels: {count_supprimes} supprimés, {count_echus} marqués échués")
    return {'supprimes': count_supprimes, 'echus': count_echus}


@shared_task
def envoyer_notifications_nouvelles_inscriptions(event_id):
    """
    Envoie des notifications aux organisateurs pour les nouvelles inscriptions
    """
    try:
        event = Event.objects.get(pk=event_id)
        
        if not event.notifications_activees:
            return False
        
        # Compter les nouvelles inscriptions (dernières 24h)
        nouvelles_inscriptions = InscriptionEvent.objects.filter(
            event=event,
            date_inscription__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        if nouvelles_inscriptions == 0:
            return False
        
        # Préparer le contexte
        context = {
            'event': event,
            'nouvelles_inscriptions': nouvelles_inscriptions,
            'total_inscriptions': event.inscriptions.filter(
                statut__in=['confirmee', 'presente']
            ).count(),
            'places_restantes': max(0, event.max_participants - event.inscriptions.filter(
                statut__in=['confirmee', 'presente']
            ).count())
        }
        
        # Générer l'email
        subject = f"Nouvelles inscriptions - {event.titre}"
        message = render_to_string('events/emails/notification_organisateur.html', context)
        
        # Envoyer à l'organisateur
        send_mail(
            subject=subject,
            message='',
            html_message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[event.cree_par.email],
            fail_silently=False
        )
        
        logger.info(f"Notification organisateur envoyée pour l'événement {event_id}")
        return True
        
    except Event.DoesNotExist:
        logger.error(f"Événement {event_id} introuvable")
        return False
    except Exception as e:
        logger.error(f"Erreur notification organisateur {event_id}: {str(e)}")
        return False


@shared_task
def traiter_liste_attente(event_id):
    """
    Traite la liste d'attente quand une place se libère
    """
    try:
        event = Event.objects.get(pk=event_id)
        
        if not event.liste_attente_activee:
            return False
        
        # Vérifier s'il y a des places disponibles
        places_occupees = event.inscriptions.filter(
            statut__in=['confirmee', 'presente']
        ).count()
        
        places_disponibles = event.max_participants - places_occupees
        
        if places_disponibles <= 0:
            return False
        
        # Récupérer les inscriptions en attente (FIFO)
        inscriptions_attente = InscriptionEvent.objects.filter(
            event=event,
            statut='en_attente'
        ).order_by('date_inscription')[:places_disponibles]
        
        count_confirmees = 0
        
        for inscription in inscriptions_attente:
            inscription.statut = 'confirmee'
            inscription.save()
            
            # Envoyer une notification de confirmation
            envoyer_confirmation_inscription(inscription)
            count_confirmees += 1
        
        logger.info(f"Liste d'attente traitée pour {event_id}: {count_confirmees} confirmées")
        return count_confirmees
        
    except Event.DoesNotExist:
        logger.error(f"Événement {event_id} introuvable")
        return False
    except Exception as e:
        logger.error(f"Erreur traitement liste d'attente {event_id}: {str(e)}")
        return False


@shared_task
def generer_rapport_mensuel_events():
    """
    Génère un rapport mensuel des événements
    """
    from django.db.models import Count, Avg
    
    # Période du mois dernier
    aujourd_hui = timezone.now().date()
    debut_mois = aujourd_hui.replace(day=1) - timedelta(days=1)
    debut_mois = debut_mois.replace(day=1)
    fin_mois = aujourd_hui.replace(day=1) - timedelta(days=1)
    
    # Statistiques du mois
    stats = {
        'periode': f"{debut_mois.strftime('%B %Y')}",
        'events_crees': Event.objects.filter(
            date_creation__date__range=[debut_mois, fin_mois]
        ).count(),
        'events_realises': Event.objects.filter(
            date_debut__date__range=[debut_mois, fin_mois],
            statut='termine'
        ).count(),
        'total_inscriptions': InscriptionEvent.objects.filter(
            date_inscription__date__range=[debut_mois, fin_mois]
        ).count(),
        'taux_presence': 0,
        'evaluation_moyenne': 0
    }
    
    # Calcul du taux de présence
    inscriptions_periode = InscriptionEvent.objects.filter(
        event__date_debut__date__range=[debut_mois, fin_mois],
        statut__in=['presente', 'absente']
    )
    
    if inscriptions_periode.exists():
        presentes = inscriptions_periode.filter(statut='presente').count()
        total_attendu = inscriptions_periode.count()
        stats['taux_presence'] = round((presentes / total_attendu) * 100, 2)
    
    # Évaluation moyenne
    evaluations = InscriptionEvent.objects.filter(
        event__date_debut__date__range=[debut_mois, fin_mois],
        evaluation_event__isnull=False
    )
    
    if evaluations.exists():
        stats['evaluation_moyenne'] = round(
            evaluations.aggregate(moyenne=Avg('evaluation_event'))['moyenne'], 2
        )
    
    logger.info(f"Rapport mensuel généré: {stats}")
    
    # Ici vous pourriez envoyer le rapport par email aux administrateurs
    # ou l'enregistrer dans une base de données
    
    return stats


@shared_task
def synchroniser_calendriers_externes():
    """
    Synchronise les événements avec des calendriers externes (si configuré)
    """
    # Cette tâche pourrait synchroniser avec Google Calendar, Outlook, etc.
    # Implémentation selon les besoins spécifiques
    
    logger.info("Synchronisation calendriers externes - non implémentée")
    return True