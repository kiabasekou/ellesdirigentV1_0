# ============================================================================
# backend/events/tasks.py
# ============================================================================
"""
Tâches asynchrones pour les événements
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import RappelEvent
from .utils import envoyer_rappel_event


@shared_task
def envoyer_rappels_programmes():
    """Envoie les rappels programmés"""
    maintenant = timezone.now()
    
    rappels_a_envoyer = RappelEvent.objects.filter(
        statut='programme',
        date_programmee__lte=maintenant
    ).select_related('event', 'destinataire')
    
    count_succes = 0
    count_echec = 0
    
    for rappel in rappels_a_envoyer:
        if envoyer_rappel_event(rappel):
            count_succes += 1
        else:
            count_echec += 1
    
    return {
        'rappels_envoyes': count_succes,
        'rappels_echec': count_echec
    }


@shared_task
def nettoyer_rappels_expires():
    """Nettoie les rappels expirés"""
    # Supprimer les rappels d'événements passés
    rappels_expires = RappelEvent.objects.filter(
        event__date_fin__lt=timezone.now() - timedelta(days=7)
    )
    
    count = rappels_expires.count()
    rappels_expires.delete()
    
    return {'rappels_supprimes': count}


@shared_task
def generer_rapport_mensuel():
    """Génère un rapport mensuel des événements"""
    from django.core.mail import send_mail
    from django.template.loader import render_to_string
    from django.conf import settings
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    maintenant = timezone.now()
    debut_mois = maintenant.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fin_mois = (debut_mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    # Statistiques du mois
    from .models import Event, InscriptionEvent
    
    events_mois = Event.objects.filter(
        date_debut__range=[debut_mois, fin_mois]
    )
    
    inscriptions_mois = InscriptionEvent.objects.filter(
        date_inscription__range=[debut_mois, fin_mois]
    )
    
    stats = {
        'periode': debut_mois.strftime('%B %Y'),
        'events_organises': events_mois.count(),
        'inscriptions_totales': inscriptions_mois.count(),
        'participants_uniques': inscriptions_mois.values('participante').distinct().count(),
        'events_passes': events_mois.filter(date_fin__lt=maintenant).count(),
    }
    
    # Envoyer aux administrateurs
    admins = User.objects.filter(is_staff=True, is_active=True)
    
    for admin in admins:
        html_message = render_to_string('events/emails/rapport_mensuel.html', {
            'admin': admin,
            'stats': stats,
            'events': events_mois[:10]  # Top 10 events du mois
        })
        
        send_mail(
            subject=f"Rapport mensuel événements - {stats['periode']}",
            message='Voir la version HTML',
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin.email],
            fail_silently=True
        )
    
    return stats
