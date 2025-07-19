"""
Signaux pour la gestion automatique des profils utilisateurs
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Participante, UserProfile


@receiver(post_save, sender=Participante)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crée automatiquement un UserProfile quand une Participante est créée
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=Participante)
def save_user_profile(sender, instance, **kwargs):
    """
    Sauvegarde le profil utilisateur quand la Participante est sauvegardée
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()