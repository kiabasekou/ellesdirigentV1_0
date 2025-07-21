# ============================================================================
# backend/events/signals.py
# ============================================================================
"""
Signaux pour le module événements
Gestion automatique des actions sur les modèles
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from .models import Event, InscriptionEvent, RappelEvent
from .tasks import (
    creer_rappels_automatiques, 
    traiter_liste_attente,
    envoyer_notifications_nouvelles_inscriptions
)


@receiver(post_save, sender=Event)
def event_post_save(sender, instance, created, **kwargs):
    """Actions après sauvegarde d'un événement"""
    
    if created:
        # Nouvel événement créé
        print(f"Nouvel événement créé: {instance.titre}")
        
        # Programmer la création des rappels automatiques si configurés
        if instance.notifications_activees and instance.rappels_automatiques:
            # Délai de 5 minutes pour laisser le temps aux inscriptions
            creer_rappels_automatiques.apply_async(countdown=300)
    else:
        # Événement modifié
        # Si les rappels automatiques ont été modifiés, recréer les rappels
        if hasattr(instance, '_old_rappels_automatiques'):
            if instance._old_rappels_automatiques != instance.rappels_automatiques:
                # Supprimer les anciens rappels non envoyés
                RappelEvent.objects.filter(
                    event=instance,
                    statut='programme'
                ).delete()
                
                # Créer les nouveaux rappels
                if instance.notifications_activees and instance.rappels_automatiques:
                    creer_rappels_automatiques.apply_async(countdown=60)


@receiver(pre_save, sender=Event)
def event_pre_save(sender, instance, **kwargs):
    """Actions avant sauvegarde d'un événement"""
    
    # Sauvegarder l'ancienne valeur des rappels automatiques
    if instance.pk:
        try:
            old_instance = Event.objects.get(pk=instance.pk)
            instance._old_rappels_automatiques = old_instance.rappels_automatiques
        except Event.DoesNotExist:
            pass


@receiver(post_save, sender=InscriptionEvent)
def inscription_post_save(sender, instance, created, **kwargs):
    """Actions après sauvegarde d'une inscription"""
    
    if created:
        # Nouvelle inscription
        print(f"Nouvelle inscription: {instance.participante} -> {instance.event.titre}")
        
        # Créer les rappels automatiques pour cette inscription
        if (instance.event.notifications_activees and 
            instance.event.rappels_automatiques and
            instance.statut in ['confirmee', 'presente']):
            
            for heures_avant in instance.event.rappels_automatiques:
                date_programmee = instance.event.date_debut - timedelta(hours=heures_avant)
                
                # Ne créer que si la date est dans le futur
                if date_programmee > timezone.now():
                    RappelEvent.objects.get_or_create(
                        event=instance.event,
                        destinataire=instance.participante,
                        type_rappel='rappel',
                        heures_avant=heures_avant,
                        defaults={
                            'date_programmee': date_programmee,
                            'statut': 'programme'
                        }
                    )
        
        # Envoyer une notification à l'organisateur
        if instance.event.notifications_activees:
            envoyer_notifications_nouvelles_inscriptions.apply_async(
                args=[instance.event.id],
                countdown=300  # Délai de 5 minutes pour grouper les notifications
            )
    
    else:
        # Inscription modifiée
        # Si le statut change vers 'confirmee', traiter la liste d'attente
        if hasattr(instance, '_old_statut'):
            if (instance._old_statut != 'confirmee' and 
                instance.statut == 'confirmee' and
                instance.event.liste_attente_activee):
                
                traiter_liste_attente.apply_async(
                    args=[instance.event.id],
                    countdown=60
                )


@receiver(pre_save, sender=InscriptionEvent)
def inscription_pre_save(sender, instance, **kwargs):
    """Actions avant sauvegarde d'une inscription"""
    
    # Sauvegarder l'ancien statut pour comparaison
    if instance.pk:
        try:
            old_instance = InscriptionEvent.objects.get(pk=instance.pk)
            instance._old_statut = old_instance.statut
        except InscriptionEvent.DoesNotExist:
            pass


@receiver(post_delete, sender=InscriptionEvent)
def inscription_post_delete(sender, instance, **kwargs):
    """Actions après suppression d'une inscription"""
    
    print(f"Inscription supprimée: {instance.participante} -> {instance.event.titre}")
    
    # Supprimer les rappels associés
    RappelEvent.objects.filter(
        event=instance.event,
        destinataire=instance.participante
    ).delete()
    
    # Traiter la liste d'attente si une place se libère
    if (instance.statut in ['confirmee', 'presente'] and 
        instance.event.liste_attente_activee):
        
        traiter_liste_attente.apply_async(
            args=[instance.event.id],
            countdown=60
        )


@receiver(post_save, sender=RappelEvent)
def rappel_post_save(sender, instance, created, **kwargs):
    """Actions après sauvegarde d'un rappel"""
    
    if created:
        print(f"Rappel créé: {instance.heures_avant}h avant {instance.event.titre}")
        
        # Programmer l'envoi du rappel si la date est proche
        if instance.statut == 'programme':
            # Si le rappel doit être envoyé dans moins d'une heure, le programmer
            temps_avant_envoi = instance.date_programmee - timezone.now()
            if temps_avant_envoi.total_seconds() < 3600:  # Moins d'1 heure
                from .tasks import envoyer_rappel_event
                envoyer_rappel_event.apply_async(
                    args=[instance.id],
                    eta=instance.date_programmee
                )


# Signaux pour la gestion des quotas et limitations
@receiver(pre_save, sender=InscriptionEvent)
def verifier_capacite_event(sender, instance, **kwargs):
    """Vérifie la capacité avant d'inscrire"""
    
    # Seulement pour les nouvelles inscriptions avec statut confirmé
    if not instance.pk and instance.statut == 'confirmee':
        inscriptions_confirmees = InscriptionEvent.objects.filter(
            event=instance.event,
            statut__in=['confirmee', 'presente']
        ).count()
        
        if inscriptions_confirmees >= instance.event.max_participants:
            # Si liste d'attente activée, basculer en attente
            if instance.event.liste_attente_activee:
                instance.statut = 'en_attente'
            else:
                from django.core.exceptions import ValidationError
                raise ValidationError("Événement complet")


# Signaux pour les statistiques et logs
@receiver(post_save, sender=Event)
def log_event_creation(sender, instance, created, **kwargs):
    """Log la création d'événements"""
    
    if created:
        import logging
        logger = logging.getLogger('events')
        logger.info(
            f"Événement créé: {instance.titre} par {instance.cree_par.get_full_name()}"
        )


@receiver(post_save, sender=InscriptionEvent)
def log_inscription_creation(sender, instance, created, **kwargs):
    """Log les inscriptions"""
    
    if created:
        import logging
        logger = logging.getLogger('events')
        logger.info(
            f"Inscription: {instance.participante.get_full_name()} -> {instance.event.titre}"
        )


# Signaux pour la cohérence des données
@receiver(pre_save, sender=Event)
def valider_coherence_event(sender, instance, **kwargs):
    """Validation de cohérence avant sauvegarde"""
    
    # Vérifier que la date de fin est après la date de début
    if instance.date_fin <= instance.date_debut:
        from django.core.exceptions import ValidationError
        raise ValidationError("La date de fin doit être postérieure à la date de début")
    
    # Vérifier la date limite d'inscription
    if (instance.date_limite_inscription and 
        instance.date_limite_inscription >= instance.date_debut):
        from django.core.exceptions import ValidationError
        raise ValidationError(
            "La date limite d'inscription doit être antérieure au début de l'événement"
        )
    
    # Génération automatique du slug si manquant
    if not instance.slug:
        from django.utils.text import slugify
        base_slug = slugify(instance.titre)
        slug = base_slug
        counter = 1
        while Event.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        instance.slug = slug


# Signal pour nettoyer les données orphelines
@receiver(post_delete, sender=Event)
def nettoyer_donnees_event(sender, instance, **kwargs):
    """Nettoie les données liées à un événement supprimé"""
    
    # Les inscriptions et rappels sont supprimés automatiquement (CASCADE)
    # Mais on peut ajouter d'autres nettoyages si nécessaire
    
    import logging
    logger = logging.getLogger('events')
    logger.info(f"Événement supprimé: {instance.titre}")


# Signaux pour la synchronisation avec des systèmes externes
@receiver(post_save, sender=Event)
def synchroniser_calendrier_externe(sender, instance, created, **kwargs):
    """Synchronise avec un calendrier externe si configuré"""
    
    # Cette fonction pourrait synchroniser avec Google Calendar, Outlook, etc.
    # selon la configuration de l'instance
    
    if hasattr(instance, 'sync_externe') and instance.sync_externe:
        from .tasks import synchroniser_calendriers_externes
        synchroniser_calendriers_externes.apply_async(
            args=[instance.id],
            countdown=60
        )