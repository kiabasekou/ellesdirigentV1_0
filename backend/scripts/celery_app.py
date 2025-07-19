"""
Configuration Celery pour les tâches asynchrones
Gère les notifications, l'envoi d'emails et les tâches lourdes
"""
import os
from celery import Celery
from celery.schedules import crontab

# Définir les settings Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_femmes_backend.settings.production')

# Créer l'instance Celery
app = Celery('plateforme_femmes_backend')

# Configuration depuis les settings Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Découverte automatique des tâches
app.autodiscover_tasks()

# Configuration des tâches périodiques
app.conf.beat_schedule = {
    # Nettoyer les sessions expirées tous les jours à 2h
    'clean-expired-sessions': {
        'task': 'users.tasks.clean_expired_sessions',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Mettre à jour les statistiques toutes les heures
    'update-platform-stats': {
        'task': 'api.tasks.update_platform_statistics',
        'schedule': crontab(minute=0),
    },
    
    # Envoyer les rappels d'événements tous les jours à 9h
    'send-event-reminders': {
        'task': 'events.tasks.send_event_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    
    # Nettoyer les fichiers temporaires tous les jours à 3h
    'clean-temp-files': {
        'task': 'document_upload.tasks.clean_temporary_files',
        'schedule': crontab(hour=3, minute=0),
    },
    
    # Générer les rapports mensuels le 1er de chaque mois
    'generate-monthly-reports': {
        'task': 'api.tasks.generate_monthly_reports',
        'schedule': crontab(day_of_month=1, hour=0, minute=0),
    },
    
    # Vérifier les utilisateurs inactifs tous les lundis
    'check-inactive-users': {
        'task': 'users.tasks.check_inactive_users',
        'schedule': crontab(day_of_week=1, hour=10, minute=0),
    },
}

# Configuration des routes de tâches
app.conf.task_routes = {
    'users.tasks.send_email': {'queue': 'email'},
    'users.tasks.process_avatar': {'queue': 'media'},
    'events.tasks.send_event_reminders': {'queue': 'notifications'},
    'api.tasks.generate_report': {'queue': 'reports'},
}

# Configuration des priorités
app.conf.task_default_priority = 5
app.conf.task_priority_max = 10
app.conf.task_priority_min = 1

# Configuration de la sérialisation
app.conf.task_serializer = 'json'
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']

# Configuration des timeouts
app.conf.task_soft_time_limit = 300  # 5 minutes
app.conf.task_time_limit = 600  # 10 minutes

# Configuration de la rétention des résultats
app.conf.result_expires = 3600  # 1 heure

@app.task(bind=True)
def debug_task(self):
    """Tâche de debug pour tester Celery"""
    print(f'Request: {self.request!r}')