# ============================================================================
# backend/events/apps.py
# ============================================================================
"""
Configuration de l'application events
"""
from django.apps import AppConfig


class EventsConfig(AppConfig):
    """Configuration de l'application événements"""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'events'
    verbose_name = 'Événements'
    
    def ready(self):
        """Configuration lors du chargement de l'application"""
        import events.signals  # Importer les signaux