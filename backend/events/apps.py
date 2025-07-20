# ============================================================================
# backend/events/apps.py
# ============================================================================
"""
Configuration de l'application événements
"""
from django.apps import AppConfig


class EventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'events'
    verbose_name = 'Événements'
    
    def ready(self):
        import events.signals
