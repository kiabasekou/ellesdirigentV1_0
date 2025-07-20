# ============================================================================
# backend/events/signals.py
# ============================================================================
"""
Signaux pour les événements
"""
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Event, InscriptionEvent, RappelEvent
from .utils import planifier_rappels_automatiques, envoyer_confirmation_inscription


@receiver(post_save, sender=InscriptionEvent)
def gerer_inscription_event(sender, instance, created, **kwargs):
    """Actions après création/modification d'une inscription"""
    if created:
        # Envoyer email de confirmation
        if instance.event.notifications_activees:
            envoyer_confirmation_inscription(instance)
        
        # Planifier rappels automatiques si l'inscription est confirmée
        if (instance.statut == 'confirmee' and 
            instance.event.rappels_automatiques and 
            instance.event.notifications_activees):
            
            # Créer les rappels pour cette participante
            for heures_avant in instance.event.rappels_automatiques:
                date_programmee = instance.event.date_debut - timezone.timedelta(hours=heures_avant)
                
                if date_programmee > timezone.now():
                    RappelEvent.objects.get_or_create(
                        event=instance.event,
                        destinataire=instance.participante,
                        type_rappel='email',
                        heures_avant=heures_avant,
                        defaults={'date_programmee': date_programmee}
                    )


@receiver(pre_delete, sender=InscriptionEvent)
def nettoyer_rappels_inscription(sender, instance, **kwargs):
    """Nettoie les rappels quand une inscription est supprimée"""
    RappelEvent.objects.filter(
        event=instance.event,
        destinataire=instance.participante,
        statut='programme'
    ).delete()


@receiver(post_save, sender=Event)
def gerer_modification_event(sender, instance, created, **kwargs):
    """Actions après création/modification d'un événement"""
    if created:
        return
    
    # Si la date de l'événement a changé, mettre à jour les rappels
    if hasattr(instance, '_original_date_debut'):
        if instance._original_date_debut != instance.date_debut:
            # Mettre à jour les dates des rappels programmés
            rappels = RappelEvent.objects.filter(
                event=instance,
                statut='programme'
            )
            
            for rappel in rappels:
                nouvelle_date = instance.date_debut - timezone.timedelta(hours=rappel.heures_avant)
                if nouvelle_date > timezone.now():
                    rappel.date_programmee = nouvelle_date
                    rappel.save()
                else:
                    rappel.delete()  # Supprimer si dans le passé

