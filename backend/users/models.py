"""
Modèles optimisés avec indexation appropriée et méthodes performantes
Inclut la gestion des images, le cache et les requêtes optimisées
"""
import os
import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.core.validators import FileExtensionValidator, MaxValueValidator
from django.db import models
from django.db.models import F, Q, Avg, Count
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill, SmartResize


def user_directory_path(instance, filename):
    """
    Génère un chemin unique pour les fichiers uploadés
    Format: uploads/user_<id>/<year>/<month>/<uuid>_<filename>
    """
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    # Si l'instance n'a pas encore d'ID (nouveau user), utilisez un ID temporaire ou gérez autrement
    # Pour le scénario de création, il est préférable que l'ID soit généré après save.
    # Pour l'upload, l'instance.id devrait être disponible si l'user existe déjà.
    # Pour un nouveau user avant sa première sauvegarde, il faut gérer autrement.
    # Pour simplifier et si l'upload se fait après création de l'objet user, user.id est disponible.
    user_id = instance.id if instance.id else 'temp' # Fallback pour les nouveaux objets
    return os.path.join(
        'uploads',
        f'user_{user_id}',
        timezone.now().strftime('%Y'),
        timezone.now().strftime('%m'),
        filename
    )


class ParticipanteQuerySet(models.QuerySet):
    """QuerySet personnalisé pour optimiser les requêtes"""

    def verified(self):
        """Retourne uniquement les participantes vérifiées"""
        return self.filter(statut_validation='validee')

    def pending(self):
        """Retourne les participantes en attente de validation"""
        return self.filter(statut_validation='en_attente')

    def with_profile_complete(self):
        """Retourne les participantes avec profil complet"""
        return self.filter(
            Q(profile__bio__isnull=False) &
            ~Q(profile__bio='') &
            Q(profile__completion_percentage__gte=80)
        )

    def by_region(self, region):
        """Filtre par région avec cache"""
        cache_key = f'participants_region_{region}'
        result = cache.get(cache_key)
        if result is None:
            result = self.filter(region=region).select_related('profile')
            cache.set(cache_key, result, 300)  # Cache 5 minutes
        return result

    def with_stats(self):
        """Ajoute les statistiques aux participantes"""
        return self.annotate(
            forums_count=Count('forum_posts'), # Assurez-vous que 'forum_posts' existe en tant que related_name
            events_count=Count('event_registrations'), # Assurez-vous que 'event_registrations' existe
            resources_count=Count('uploaded_resources'), # Assurez-vous que 'uploaded_resources' existe
            # avg_rating=Avg('received_ratings__score') # Décommentez si vous avez un modèle de notation
        )


# MODIFICATION ICI : ParticipanteManager doit hériter de BaseUserManager et contenir create_user/create_superuser
class ParticipanteManager(BaseUserManager):
    """
    Manager personnalisé pour le modèle Participante.
    Hérite de BaseUserManager pour la gestion des utilisateurs et superutilisateurs.
    """
    def get_queryset(self):
        return ParticipanteQuerySet(self.model, using=self._db)

    def verified(self):
        return self.get_queryset().verified()

    def pending(self):
        return self.get_queryset().pending()

    # Méthodes obligatoires pour un custom user model
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('L\'adresse email doit être fournie.'))
        if not username:
            raise ValueError(_('Le nom d\'utilisateur doit être fourni.'))

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('statut_validation', 'validee') # Superuser est toujours validé

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(username, email, password, **extra_fields)


# MODIFICATION ICI : Participante hérite de AbstractUser et PermissionsMixin
class Participante(AbstractUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé avec optimisations:
    - Index sur les champs fréquemment requêtés
    - Propriétés cachées pour les calculs coûteux
    - Méthodes optimisées pour les requêtes fréquentes
    """

    STATUS_CHOICES = [
        ('en_attente', _('En attente')),
        ('validee', _('Validée')),
        ('rejetee', _('Rejetée')),
    ]

    EXPERIENCE_CHOICES = [
        ('aucune', _('Aucune')),
        ('locale', _('Locale')),
        ('regionale', _('Régionale')),
        ('nationale', _('Nationale')),
    ]

    # Identifiant unique
    # Note: AbstractUser a déjà un champ 'id' qui est auto-incrémenté.
    # Si vous voulez un UUID comme PK, il faut le gérer différemment ou supprimer le PK par défaut d'AbstractUser
    # en réécrivant le champ 'id' ou en définissant un autre champ comme primary_key.
    # Pour la plupart des cas, garder l'id par défaut d'AbstractUser est plus simple.
    # Si vous tenez à l'UUID, assurez-vous qu'il est défini comme primary_key=True et que AbstractUser ne définit pas déjà un PK.
    # Pour le moment, je commente votre définition de 'id' pour éviter les conflits avec AbstractUser.
    # id = models.UUIDField(
    #     primary_key=True,
    #     default=uuid.uuid4,
    #     editable=False
    # )

    # AbstractUser a déjà 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_active', 'date_joined'.
    # Si vous les redéfinissez, ils doivent être compatibles.
    # Assurez-vous que le champ 'email' n'est pas déjà défini par AbstractUser si vous voulez qu'il soit unique.
    # Par défaut, email n'est pas unique dans AbstractUser.
    email = models.EmailField(
        _('email address'),
        unique=True,
        db_index=True,  # Index pour les recherches rapides
        error_messages={
            'unique': _("Un compte avec cette adresse email existe déjà."),
        }
    )

    # Note : AbstractUser gère déjà les champs 'first_name', 'last_name', 'email'.
    # Pas besoin de les redéfinir sauf si vous voulez changer leurs propriétés (ex: unique, null, blank).
    # Assurez-vous que ces champs sont définis dans REQUIRED_FIELDS du manager si vous voulez qu'ils soient obligatoires
    # lors de la création d'un user via create_user/create_superuser.

    nip = models.CharField(
        _('NIP'),
        max_length=20,
        unique=True,
        db_index=True,  # Index pour validation rapide
        help_text=_("Numéro d'Identification Personnel")
    )

    # Informations personnelles
    phone = models.CharField(
        _('téléphone'),
        max_length=20,
        blank=True,
        db_index=True  # Index pour recherche
    )

    date_of_birth = models.DateField(
        _('date de naissance'),
        null=True,
        blank=True
    )

    # Localisation avec index composé
    region = models.CharField(
        _('région'),
        max_length=100,
        db_index=True,
        choices=[
            ('estuaire', 'Estuaire'),
            ('haut_ogooue', 'Haut-Ogooué'),
            ('moyen_ogooue', 'Moyen-Ogooué'),
            ('ngounie', 'Ngounié'),
            ('nyanga', 'Nyanga'),
            ('ogooue_ivindo', 'Ogooué-Ivindo'),
            ('ogooue_lolo', 'Ogooué-Lolo'),
            ('ogooue_maritime', 'Ogooué-Maritime'),
            ('woleu_ntem', 'Woleu-Ntem'),
        ]
    )

    ville = models.CharField(
        _('ville'),
        max_length=100,
        blank=True, # Added blank=True as it's often dependent on region
        db_index=True
    )

    # Expérience politique
    experience = models.CharField(
        _('expérience politique'),
        max_length=20,
        choices=EXPERIENCE_CHOICES, # Use the defined choices
        default='aucune',
        db_index=True
    )

    # Documents avec validation
    document_justificatif = models.FileField(
        _('document justificatif'),
        upload_to=user_directory_path,
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png']),
            MaxValueValidator(5 * 1024 * 1024)  # 5MB max
        ],
        help_text=_("PDF, JPG ou PNG. Taille max: 5MB"),
        blank=True, # Permet d'être vide pour la création initiale
        null=True
    )

    # Photo de profil avec versions optimisées
    avatar = models.ImageField(
        _('photo de profil'),
        upload_to=user_directory_path,
        blank=True,
        null=True
    )

    avatar_thumbnail = ImageSpecField(
        source='avatar',
        processors=[ResizeToFill(150, 150)],
        format='JPEG',
        options={'quality': 85}
    )

    avatar_small = ImageSpecField(
        source='avatar',
        processors=[ResizeToFill(50, 50)],
        format='JPEG',
        options={'quality': 80}
    )

    # Statut de validation avec index
    statut_validation = models.CharField(
        _('statut de validation'),
        max_length=20,
        choices=STATUS_CHOICES, # Use the defined choices
        default='en_attente',
        db_index=True
    )

    motif_rejet = models.TextField(
        _('motif de rejet'),
        blank=True,
        null=True
    )

    # Métadonnées
    validated_at = models.DateTimeField(
        _('date de validation'),
        null=True,
        blank=True,
        db_index=True
    )

    validated_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_users',
        verbose_name=_('validé par')
    )

    last_activity = models.DateTimeField(
        _('dernière activité'),
        default=timezone.now,
        db_index=True
    )

    # Préférences utilisateur
    email_notifications = models.BooleanField(
        _('notifications email'),
        default=True
    )

    is_mentor = models.BooleanField(
        _('est mentor'),
        default=False,
        db_index=True
    )

    # Manager personnalisé
    objects = ParticipanteManager()

    # Champs requis pour la création d'un utilisateur par la commande createsuperuser ou create_user
    # Ces champs seront demandés si non fournis
    USERNAME_FIELD = 'username' # AbstractUser a déjà un champ 'username'.
    EMAIL_FIELD = 'email'
    # Listez les champs *supplémentaires* qui sont requis en plus de USERNAME_FIELD et password
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'nip', 'region', 'ville']


    class Meta:
        verbose_name = _('Participante')
        verbose_name_plural = _('Participantes')
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['region', 'ville']),  # Index composé pour recherches géographiques
            models.Index(fields=['statut_validation', 'validated_at']),  # Pour les requêtes admin
            models.Index(fields=['is_active', 'last_activity']),  # Pour les utilisateurs actifs
        ]

    def __str__(self):
        # AbstractUser a déjà get_full_name()
        return f"{self.get_full_name()} ({self.nip})" if self.get_full_name() else self.username

    def save(self, *args, **kwargs):
        """Override save pour gérer les changements de statut"""
        if self.pk:
            old_instance = Participante.objects.filter(pk=self.pk).first()
            if old_instance and old_instance.statut_validation != self.statut_validation:
                if self.statut_validation == 'validee':
                    self.validated_at = timezone.now()
                    # Invalider le cache
                    cache.delete(f'participant_{self.pk}_stats')
                    cache.delete(f'participants_region_{self.region}')

        super().save(*args, **kwargs)

    @property
    def nom_complet(self):
        """Retourne le nom complet avec cache"""
        return self.get_full_name() or self.username

    @property
    def is_validated(self):
        """Vérifie si le compte est validé"""
        return self.statut_validation == 'validee'

    @property
    def age(self):
        """Calcule l'âge de la participante"""
        if not self.date_of_birth:
            return None
        today = timezone.now().date()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    
    # Dans la méthode get_stats() vers la ligne 370, remplacez par :
    def get_stats(self):
        """Retourne les statistiques avec cache - Version simplifiée"""
        cache_key = f'participant_{self.pk}_stats'
        stats = cache.get(cache_key)

        if stats is None:
            stats = {
                'forums_count': 0,  # Placeholder - sera implémenté plus tard
                'events_count': 0,  # Placeholder
                'resources_count': 0,  # Placeholder
                'connections_count': 0,  # Placeholder
                'mentees_count': 0 if not self.is_mentor else 0,  # Placeholder
            }
            cache.set(cache_key, stats, 3600)  # Cache 1 heure

        return stats

    """""
    def get_stats(self):
        #Retourne les statistiques avec cache
        cache_key = f'participant_{self.pk}_stats'
        stats = cache.get(cache_key)

        if stats is None:
            stats = {
                # Assurez-vous que les related_name sont corrects pour ces compteurs
                'forums_count': getattr(self, 'forum_posts', Participante.objects.none()).count(),
                'events_count': getattr(self, 'event_registrations', Participante.objects.none()).count(),
                'resources_count': getattr(self, 'uploaded_resources', Participante.objects.none()).count(),
                'connections_count': getattr(self, 'connections', Participante.objects.none()).count(),
                'mentees_count': getattr(self, 'mentees', Participante.objects.none()).count() if self.is_mentor else 0,
            }
            cache.set(cache_key, stats, 3600)  # Cache 1 heure

        return stats
    """

    def update_last_activity(self):
        """Met à jour la dernière activité sans déclencher les signaux"""
        Participante.objects.filter(pk=self.pk).update(last_activity=timezone.now())

    def get_completion_percentage(self):
        """Calcule le pourcentage de complétion du profil"""
        # Ces champs sont sur le modèle Participante directement
        required_fields = [
            'first_name', 'last_name', 'email', 'phone',
            'date_of_birth', 'region', 'ville', 'document_justificatif'
        ]

        completed = sum(1 for field in required_fields if getattr(self, field))

        # Ajouter des points pour le profil étendu
        # Vérifiez l'existence du profil
        if hasattr(self, 'profile'):
            profile_instance = self.profile
            if profile_instance.bio:
                completed += 2
            if profile_instance.skills: # JSONField peut être vide []
                completed += 1
            if profile_instance.political_interests: # JSONField peut être vide []
                completed += 1

        total = len(required_fields) + 4 # Fields + profil étendu
        return int((completed / total) * 100)


class UserProfile(models.Model):
    """
    Profil étendu avec informations supplémentaires
    Séparé du modèle principal pour optimiser les requêtes
    """
    user = models.OneToOneField(
        Participante,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    # Biographie et description
    bio = models.TextField(
        _('biographie'),
        max_length=1000,
        blank=True,
        help_text=_("Décrivez votre parcours et vos motivations")
    )

    # Éducation et compétences
    education_level = models.CharField(
        _('niveau d\'éducation'),
        max_length=50,
        blank=True,
        choices=[
            ('primaire', _('Primaire')),
            ('secondaire', _('Secondaire')),
            ('licence', _('Licence')),
            ('master', _('Master')),
            ('doctorat', _('Doctorat')),
        ]
    )

    skills = models.JSONField(
        _('compétences'),
        default=list,
        blank=True
    )

    languages = models.JSONField(
        _('langues parlées'),
        default=list,
        blank=True
    )

    # Intérêts et aspirations
    political_interests = models.JSONField(
        _('intérêts politiques'),
        default=list,
        blank=True
    )

    career_goals = models.TextField(
        _('objectifs de carrière'),
        blank=True
    )

    # Position actuelle
    current_position = models.CharField(
        _('poste actuel'),
        max_length=200,
        blank=True
    )

    organization = models.CharField(
        _('organisation'),
        max_length=200,
        blank=True
    )

    # Mentorat
    mentorship_areas = models.JSONField(
        _('domaines de mentorat'),
        default=list,
        blank=True
    )

    # Réseaux sociaux
    website = models.URLField(
        _('site web'),
        blank=True
    )

    linkedin = models.URLField(
        _('LinkedIn'),
        blank=True
    )

    twitter = models.CharField(
        _('Twitter'),
        max_length=50,
        blank=True
    )

    # Statistiques calculées
    completion_percentage = models.IntegerField(
        _('pourcentage de complétion'),
        default=0,
        db_index=True
    )

    # Préférences de confidentialité
    is_public = models.BooleanField(
        _('profil public'),
        default=True
    )

    show_contact_info = models.BooleanField(
        _('afficher les informations de contact'),
        default=False
    )

    class Meta:
        verbose_name = _('Profil utilisateur')
        verbose_name_plural = _('Profils utilisateurs')

    def save(self, *args, **kwargs):
        """Calcule automatiquement le pourcentage de complétion et met à jour le profil user"""
        self.completion_percentage = self.calculate_completion()
        super().save(*args, **kwargs)

    def calculate_completion(self):
        """Calcule le pourcentage de complétion du profil étendu"""
        fields = [
            'bio', 'education_level', 'current_position',
            'organization', 'career_goals'
        ]

        completed = sum(1 for field in fields if getattr(self, field))

        # Ajouter des points pour les listes non vides
        if self.skills:
            completed += 1
        if self.languages:
            completed += 1
        if self.political_interests:
            completed += 1
        # Assurez-vous que self.user est une Participante et qu'elle est mentor
        if self.mentorship_areas and hasattr(self, 'user') and self.user.is_mentor:
            completed += 1

        total = len(fields) + 4 # 4 pour skills, languages, political_interests, mentorship_areas
        return int((completed / total) * 100)

# Ajouter ce modèle à la fin de votre fichier models.py

class NipReference(models.Model):
    """Table de référence des NIP officiels"""
    
    nip = models.CharField(max_length=20, unique=True, db_index=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "NIP de référence"
        verbose_name_plural = "NIP de référence"
        ordering = ['nom', 'prenom']
    
    def __str__(self):
        return f"{self.nom} {self.prenom} ({self.nip})"