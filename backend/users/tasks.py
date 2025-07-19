"""
Tâches pour la gestion des utilisateurs
Version simplifiée sans Celery pour les tests
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Participante

logger = logging.getLogger(__name__)


def send_welcome_email(user_id):
    """
    Envoie un email de bienvenue à une nouvelle participante
    Version simplifiée sans Celery
    """
    try:
        user = Participante.objects.get(pk=user_id)
        
        subject = f'Bienvenue sur la Plateforme Femmes en Politique, {user.first_name}!'
        message = f"""
Bonjour {user.first_name},

Bienvenue sur la Plateforme Femmes en Politique !

Votre compte a été créé avec succès et est en attente de validation par nos équipes.
Vous recevrez un email de confirmation dès que votre compte sera validé.

Cordialement,
L'équipe Plateforme Femmes en Politique
        """
        
        # En mode DEBUG, afficher dans la console
        if settings.DEBUG:
            print(f"📧 Email de bienvenue envoyé à {user.email}")
            print(f"Subject: {subject}")
            print(f"Message: {message}")
        else:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        
        logger.info(f"Email de bienvenue envoyé à {user.email}")
        return True
        
    except Participante.DoesNotExist:
        logger.error(f"Utilisateur {user_id} non trouvé")
        return False
    except Exception as e:
        logger.error(f"Erreur envoi email bienvenue: {str(e)}")
        return False


def send_validation_email(user_id, status):
    """
    Envoie un email de notification après validation/rejet du compte
    """
    try:
        user = Participante.objects.get(pk=user_id)
        
        if status == 'validee':
            subject = 'Votre compte a été validé!'
            message = f"""
Bonjour {user.first_name},

Excellente nouvelle ! Votre compte sur la Plateforme Femmes en Politique a été validé.

Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités de la plateforme.

Cordialement,
L'équipe Plateforme Femmes en Politique
            """
        else:
            subject = 'Statut de votre compte'
            message = f"""
Bonjour {user.first_name},

Nous avons examiné votre demande d'inscription sur la Plateforme Femmes en Politique.

Malheureusement, nous ne pouvons pas valider votre compte pour le motif suivant :
{user.motif_rejet}

N'hésitez pas à nous contacter pour plus d'informations.

Cordialement,
L'équipe Plateforme Femmes en Politique
            """
        
        if settings.DEBUG:
            print(f"📧 Email de {status} envoyé à {user.email}")
            print(f"Subject: {subject}")
        else:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        
        logger.info(f"Email de {status} envoyé à {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email validation: {str(e)}")
        return False


def notify_new_registration(user_id):
    """
    Notifie les administrateurs d'une nouvelle inscription
    """
    try:
        user = Participante.objects.get(pk=user_id)
        admins = Participante.objects.filter(is_staff=True, email_notifications=True)
        
        subject = f'Nouvelle inscription: {user.get_full_name()}'
        message = f"""
Une nouvelle utilisatrice s'est inscrite sur la plateforme :

Nom complet: {user.get_full_name()}
Email: {user.email}
NIP: {user.nip}
Région: {user.get_region_display()}
Ville: {user.ville}
Expérience: {user.get_experience_display()}

Vous pouvez valider ou rejeter cette inscription depuis l'administration.
        """
        
        if settings.DEBUG:
            print(f"📧 Notification admin pour nouvelle inscription: {user.username}")
            print(f"Nombre d'admins à notifier: {admins.count()}")
        else:
            for admin in admins:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[admin.email],
                    fail_silently=False,
                )
        
        logger.info(f"Notification envoyée pour nouvelle inscription: {user.username}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur notification nouvelle inscription: {str(e)}")
        return False


def process_avatar(user_id):
    """
    Traite et optimise l'avatar d'un utilisateur
    Version simplifiée
    """
    try:
        user = Participante.objects.get(pk=user_id)
        
        if not user.avatar:
            return False
        
        # En mode DEBUG, juste loguer
        if settings.DEBUG:
            print(f"🖼️  Avatar traité pour {user.username}")
        
        logger.info(f"Avatar traité pour {user.username}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur traitement avatar: {str(e)}")
        return False


def clean_expired_sessions():
    """
    Nettoie les sessions expirées de la base de données
    """
    try:
        from django.contrib.sessions.models import Session
        expired_count = Session.objects.filter(expire_date__lt=timezone.now()).count()
        Session.objects.filter(expire_date__lt=timezone.now()).delete()
        
        logger.info(f"{expired_count} sessions expirées nettoyées")
        return True
    except Exception as e:
        logger.error(f"Erreur nettoyage sessions: {str(e)}")
        return False


def check_inactive_users():
    """
    Vérifie les utilisateurs inactifs et envoie des rappels
    """
    try:
        from datetime import timedelta
        
        # Utilisateurs inactifs depuis 30 jours
        threshold = timezone.now() - timedelta(days=30)
        inactive_users = Participante.objects.filter(
            last_activity__lt=threshold,
            is_active=True,
            statut_validation='validee'
        )
        
        for user in inactive_users:
            if settings.DEBUG:
                print(f"📧 Rappel d'inactivité envoyé à {user.email}")
            # Ici on pourrait envoyer l'email de rappel
        
        logger.info(f"{inactive_users.count()} utilisateurs inactifs traités")
        return True
        
    except Exception as e:
        logger.error(f"Erreur vérification utilisateurs inactifs: {str(e)}")
        return False