"""
Module Événement - Modèles de données
Gestion des événements, inscriptions et notifications
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.urls import reverse
from django.core.exceptions import ValidationError
import uuid

User = get_user_model()


class Event(models.Model):
    """Modèle principal pour les événements"""
    
    CATEGORIES = [
        ('formation', 'Formation'),
        ('conference', 'Conférence'),
        ('atelier', 'Atelier'),
        ('networking', 'Réseautage'),
        ('webinaire', 'Webinaire'),
        ('autre', 'Autre'),
    ]
    
    STATUTS = [
        ('brouillon', 'Brouillon'),
        ('planifie', 'Planifié'),
        ('ouvert', 'Ouvert aux inscriptions'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    ]
    
    # Informations principales
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=200, verbose_name="Titre")
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    description = models.TextField(verbose_name="Description")
    description_courte = models.CharField(max_length=300, blank=True, verbose_name="Description courte")
    
    # Catégorisation
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='formation')
    tags = models.JSONField(default=list, blank=True, verbose_name="Tags")
    
    # Dates et horaires
    date_debut = models.DateTimeField(verbose_name="Date de début")
    date_fin = models.DateTimeField(verbose_name="Date de fin")
    fuseau_horaire = models.CharField(max_length=50, default='Africa/Libreville')
    
    # Localisation
    est_en_ligne = models.BooleanField(default=False, verbose_name="Événement en ligne")
    lieu = models.CharField(max_length=300, blank=True, verbose_name="Lieu")
    adresse_complete = models.TextField(blank=True, verbose_name="Adresse complète")
    coordonnees_gps = models.JSONField(default=dict, blank=True, verbose_name="Coordonnées GPS")
    lien_visioconference = models.URLField(blank=True, verbose_name="Lien visioconférence")
    
    # Gestion des participants
    max_participants = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Nombre maximum de participants"
    )
    inscription_requise = models.BooleanField(default=True, verbose_name="Inscription requise")
    inscription_ouverte = models.BooleanField(default=True, verbose_name="Inscriptions ouvertes")
    date_limite_inscription = models.DateTimeField(null=True, blank=True, verbose_name="Date limite d'inscription")
    
    # Modération et validation
    validation_requise = models.BooleanField(default=False, verbose_name="Validation manuelle requise")
    message_confirmation = models.TextField(blank=True, verbose_name="Message de confirmation d'inscription")
    
    # Informations sur l'organisateur/formateur
    organisateur = models.ForeignKey(
        User, 
        on_delete=models.PROTECT, 
        related_name='evenements_organises',
        verbose_name="Organisateur"
    )
    formateur_nom = models.CharField(max_length=100, blank=True, verbose_name="Nom du formateur")
    formateur_bio = models.TextField(blank=True, verbose_name="Biographie du formateur")
    formateur_photo = models.ImageField(upload_to='formateurs/', blank=True, verbose_name="Photo du formateur")
    
    # Contenu et ressources
    image_couverture = models.ImageField(upload_to='events/covers/', blank=True, verbose_name="Image de couverture")
    programme_detaille = models.TextField(blank=True, verbose_name="Programme détaillé")
    objectifs = models.JSONField(default=list, blank=True, verbose_name="Objectifs pédagogiques")
    prerequis = models.TextField(blank=True, verbose_name="Prérequis")
    materiel_requis = models.TextField(blank=True, verbose_name="Matériel requis")
    
    # Documents et ressources
    documents_preparation = models.JSONField(default=list, blank=True, verbose_name="Documents de préparation")
    ressources_complementaires = models.JSONField(default=list, blank=True, verbose_name="Ressources complémentaires")
    
    # Statut et workflow
    statut = models.CharField(max_length=20, choices=STATUTS, default='brouillon')
    est_publie = models.BooleanField(default=False, verbose_name="Publié")
    est_featured = models.BooleanField(default=False, verbose_name="Événement mis en avant")
    
    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    cree_par = models.ForeignKey(
        User, 
        on_delete=models.PROTECT, 
        related_name='evenements_crees',
        verbose_name="Créé par"
    )
    
    # Configuration des notifications
    notifications_activees = models.BooleanField(default=True, verbose_name="Notifications activées")
    rappels_automatiques = models.JSONField(
        default=lambda: [24, 2],  # 24h et 2h avant
        blank=True,
        verbose_name="Rappels automatiques (en heures)"
    )
    
    class Meta:
        verbose_name = "Événement"
        verbose_name_plural = "Événements"
        ordering = ['-date_debut']
        indexes = [
            models.Index(fields=['date_debut', 'categorie']),
            models.Index(fields=['statut', 'est_publie']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.titre} - {self.date_debut.strftime('%d/%m/%Y')}"
    
    def clean(self):
        """Validation personnalisée"""
        super().clean()
        
        # Vérifier que la date de fin est après la date de début
        if self.date_fin <= self.date_debut:
            raise ValidationError("La date de fin doit être postérieure à la date de début")
        
        # Vérifier la date limite d'inscription
        if self.date_limite_inscription and self.date_limite_inscription >= self.date_debut:
            raise ValidationError("La date limite d'inscription doit être antérieure au début de l'événement")
        
        # Vérifier la cohérence du lieu
        if not self.est_en_ligne and not self.lieu:
            raise ValidationError("Un lieu doit être spécifié pour les événements en présentiel")
        
        if self.est_en_ligne and not self.lien_visioconference:
            raise ValidationError("Un lien de visioconférence doit être fourni pour les événements en ligne")
    
    def save(self, *args, **kwargs):
        # Générer le slug automatiquement si pas fourni
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.titre)
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # Définir la date limite d'inscription par défaut
        if not self.date_limite_inscription:
            from datetime import timedelta
            self.date_limite_inscription = self.date_debut - timedelta(hours=2)
        
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        """URL de l'événement"""
        return reverse('events:detail', kwargs={'slug': self.slug})
    
    @property
    def places_disponibles(self):
        """Nombre de places disponibles"""
        return self.max_participants - self.participants_confirmes.count()
    
    @property
    def est_complet(self):
        """Vérifie si l'événement est complet"""
        return self.places_disponibles <= 0
    
    @property
    def inscriptions_ouvertes(self):
        """Vérifie si les inscriptions sont encore ouvertes"""
        if not self.inscription_ouverte:
            return False
        
        if self.est_complet:
            return False
        
        if self.date_limite_inscription and timezone.now() > self.date_limite_inscription:
            return False
        
        return True
    
    @property
    def est_passe(self):
        """Vérifie si l'événement est passé"""
        return timezone.now() > self.date_fin
    
    @property
    def est_en_cours(self):
        """Vérifie si l'événement est en cours"""
        now = timezone.now()
        return self.date_debut <= now <= self.date_fin
    
    @property
    def duree_en_heures(self):
        """Durée de l'événement en heures"""
        delta = self.date_fin - self.date_debut
        return delta.total_seconds() / 3600
    
    def peut_etre_modifie(self):
        """Vérifie si l'événement peut encore être modifié"""
        return self.statut in ['brouillon', 'planifie'] and not self.est_en_cours and not self.est_passe


class InscriptionEvent(models.Model):
    """Modèle pour les inscriptions aux événements"""
    
    STATUTS_INSCRIPTION = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('refusee', 'Refusée'),
        ('annulee', 'Annulée'),
        ('presente', 'Présente'),
        ('absente', 'Absente'),
    ]
    
    # Relations
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='inscriptions')
    participante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inscriptions_events')
    
    # Informations d'inscription
    date_inscription = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUTS_INSCRIPTION, default='en_attente')
    
    # Informations personnalisées
    commentaire_inscription = models.TextField(blank=True, verbose_name="Commentaire d'inscription")
    besoins_specifiques = models.TextField(blank=True, verbose_name="Besoins spécifiques")
    motivations = models.TextField(blank=True, verbose_name="Motivations")
    
    # Validation et modération
    validee_par = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='validations_effectuees',
        verbose_name="Validée par"
    )
    date_validation = models.DateTimeField(null=True, blank=True)
    commentaire_validation = models.TextField(blank=True, verbose_name="Commentaire de validation")
    
    # Présence et participation
    date_arrivee = models.DateTimeField(null=True, blank=True, verbose_name="Heure d'arrivée")
    date_depart = models.DateTimeField(null=True, blank=True, verbose_name="Heure de départ")
    evaluation_event = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Évaluation de l'événement"
    )
    commentaire_evaluation = models.TextField(blank=True, verbose_name="Commentaire d'évaluation")
    
    # Métadonnées
    ip_inscription = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Inscription à un événement"
        verbose_name_plural = "Inscriptions aux événements"
        unique_together = ['event', 'participante']
        ordering = ['-date_inscription']
        indexes = [
            models.Index(fields=['event', 'statut']),
            models.Index(fields=['participante', 'date_inscription']),
        ]
    
    def __str__(self):
        return f"{self.participante.get_full_name()} - {self.event.titre}"
    
    def clean(self):
        """Validation personnalisée"""
        super().clean()
        
        # Vérifier que l'événement accepte encore les inscriptions
        if not self.pk and not self.event.inscriptions_ouvertes:
            raise ValidationError("Les inscriptions pour cet événement sont fermées")
        
        # Vérifier la date de validation
        if self.date_validation and self.date_validation < self.date_inscription:
            raise ValidationError("La date de validation ne peut pas être antérieure à la date d'inscription")
    
    def confirmer(self, validateur=None):
        """Confirme l'inscription"""
        self.statut = 'confirmee'
        if validateur:
            self.validee_par = validateur
            self.date_validation = timezone.now()
        self.save()
    
    def refuser(self, validateur=None, commentaire=""):
        """Refuse l'inscription"""
        self.statut = 'refusee'
        if validateur:
            self.validee_par = validateur
            self.date_validation = timezone.now()
        if commentaire:
            self.commentaire_validation = commentaire
        self.save()
    
    def marquer_presente(self):
        """Marque la participante comme présente"""
        self.statut = 'presente'
        self.date_arrivee = timezone.now()
        self.save()
    
    def marquer_absente(self):
        """Marque la participante comme absente"""
        self.statut = 'absente'
        self.save()


class RappelEvent(models.Model):
    """Modèle pour les rappels d'événements"""
    
    TYPES_RAPPEL = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('notification', 'Notification in-app'),
    ]
    
    STATUTS_RAPPEL = [
        ('programme', 'Programmé'),
        ('envoye', 'Envoyé'),
        ('echec', 'Échec'),
        ('annule', 'Annulé'),
    ]
    
    # Relations
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='rappels')
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rappels_recus')
    
    # Configuration du rappel
    type_rappel = models.CharField(max_length=20, choices=TYPES_RAPPEL, default='email')
    heures_avant = models.PositiveIntegerField(verbose_name="Heures avant l'événement")
    date_programmee = models.DateTimeField(verbose_name="Date programmée d'envoi")
    
    # Contenu personnalisé
    objet_personnalise = models.CharField(max_length=200, blank=True)
    message_personnalise = models.TextField(blank=True)
    
    # Statut et exécution
    statut = models.CharField(max_length=20, choices=STATUTS_RAPPEL, default='programme')
    date_envoi = models.DateTimeField(null=True, blank=True)
    erreur_envoi = models.TextField(blank=True)
    
    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Rappel d'événement"
        verbose_name_plural = "Rappels d'événements"
        unique_together = ['event', 'destinataire', 'heures_avant', 'type_rappel']
        ordering = ['date_programmee']
    
    def __str__(self):
        return f"Rappel {self.heures_avant}h avant {self.event.titre} pour {self.destinataire.get_full_name()}"
    
    def peut_etre_envoye(self):
        """Vérifie si le rappel peut être envoyé"""
        return (
            self.statut == 'programme' and
            timezone.now() >= self.date_programmee and
            not self.event.est_passe
        )


# Manager personnalisé pour les événements
class EventManager(models.Manager):
    """Manager personnalisé pour optimiser les requêtes"""
    
    def publies(self):
        """Retourne les événements publiés"""
        return self.filter(est_publie=True, statut__in=['planifie', 'ouvert', 'en_cours'])
    
    def a_venir(self):
        """Retourne les événements à venir"""
        return self.filter(date_debut__gt=timezone.now())
    
    def en_cours(self):
        """Retourne les événements en cours"""
        now = timezone.now()
        return self.filter(date_debut__lte=now, date_fin__gte=now)
    
    def passes(self):
        """Retourne les événements passés"""
        return self.filter(date_fin__lt=timezone.now())
    
    def avec_places_disponibles(self):
        """Retourne les événements avec des places disponibles"""
        from django.db.models import Count, F
        return self.annotate(
            nb_inscrits=Count('inscriptions', filter=models.Q(inscriptions__statut='confirmee'))
        ).filter(nb_inscrits__lt=F('max_participants'))
    
    def par_categorie(self, categorie):
        """Filtre par catégorie"""
        return self.filter(categorie=categorie)
    
    def recherche(self, terme):
        """Recherche dans le titre et la description"""
        from django.db.models import Q
        return self.filter(
            Q(titre__icontains=terme) |
            Q(description__icontains=terme) |
            Q(formateur_nom__icontains=terme)
        )


# Ajouter le manager personnalisé au modèle Event
Event.add_to_class('objects', EventManager())

# Relations supplémentaires pour optimiser les requêtes
Event.add_to_class(
    'participants_confirmes',
    models.ManyToManyField(
        User,
        through='InscriptionEvent',
        related_name='events_confirmes',
        through_fields=('event', 'participante'),
        limit_choices_to={'inscriptions__statut': 'confirmee'}
    )
)