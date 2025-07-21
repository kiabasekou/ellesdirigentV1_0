# ============================================================================
# backend/training/models.py - CORRECTION LAMBDA
# ============================================================================
"""
Modèles pour le module de formation
CORRECTION: Remplacement des lambdas par des fonctions nommées
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils import timezone
from django.utils.text import slugify
from datetime import timedelta
import hashlib
import uuid

User = get_user_model()


def default_empty_list():
    """Fonction pour générer une liste vide par défaut"""
    return []


def default_empty_dict():
    """Fonction pour générer un dictionnaire vide par défaut"""
    return {}


def default_timedelta():
    """Fonction pour générer un timedelta par défaut"""
    return timedelta()


class Formation(models.Model):
    """Modèle principal pour les formations"""
    
    CATEGORIES = [
        ('communication', 'Communication'),
        ('gouvernance', 'Gouvernance'),
        ('campagne', 'Campagne Électorale'),
        ('droits_femmes', 'Droits des Femmes'),
        ('leadership', 'Leadership'),
    ]
    
    NIVEAUX = [
        ('debutant', 'Débutant'),
        ('intermediaire', 'Intermédiaire'),
        ('avance', 'Avancé'),
    ]
    
    STATUTS = [
        ('brouillon', 'Brouillon'),
        ('active', 'Active'),
        ('archivee', 'Archivée'),
        ('suspendue', 'Suspendue'),
    ]
    
    # Informations de base
    titre = models.CharField(max_length=200, verbose_name="Titre")
    slug = models.SlugField(unique=True, blank=True, max_length=250)
    description = models.TextField(verbose_name="Description")
    description_courte = models.CharField(max_length=300, blank=True, verbose_name="Description courte")
    
    # Catégorisation
    categorie = models.CharField(max_length=20, choices=CATEGORIES, verbose_name="Catégorie")
    niveau = models.CharField(max_length=20, choices=NIVEAUX, default='debutant', verbose_name="Niveau")
    tags = models.JSONField(default=default_empty_list, blank=True, verbose_name="Mots-clés")  # CORRECTION: fonction nommée
    
    # Durée et planification
    duree_heures = models.PositiveIntegerField(verbose_name="Durée en heures")
    date_debut = models.DateTimeField(verbose_name="Date de début")
    date_fin = models.DateTimeField(verbose_name="Date de fin")
    
    # Localisation
    lieu = models.CharField(max_length=300, blank=True, verbose_name="Lieu")
    adresse_complete = models.TextField(blank=True, verbose_name="Adresse complète")
    est_en_ligne = models.BooleanField(default=False, verbose_name="Formation en ligne")
    lien_visioconference = models.URLField(blank=True, verbose_name="Lien visioconférence")
    
    # Participants et coût
    max_participants = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Nombre maximum de participants"
    )
    cout = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name="Coût"
    )
    
    # Inscription
    inscription_ouverte = models.BooleanField(default=True, verbose_name="Inscription ouverte")
    date_limite_inscription = models.DateTimeField(null=True, blank=True, verbose_name="Date limite d'inscription")
    validation_requise = models.BooleanField(default=False, verbose_name="Validation requise")
    
    # Formateur
    formateur_nom = models.CharField(max_length=200, verbose_name="Nom du formateur")
    formateur_bio = models.TextField(blank=True, verbose_name="Biographie du formateur")
    formateur_photo = models.ImageField(upload_to='formateurs/', blank=True, verbose_name="Photo du formateur")
    
    # Contenu
    image_cover = models.ImageField(upload_to='formations/', blank=True, verbose_name="Image de couverture")
    programme_detaille = models.TextField(blank=True, verbose_name="Programme détaillé")
    objectifs = models.JSONField(default=default_empty_list, blank=True, verbose_name="Objectifs pédagogiques")  # CORRECTION: fonction nommée
    prerequis = models.TextField(blank=True, verbose_name="Prérequis")
    materiel_requis = models.TextField(blank=True, verbose_name="Matériel requis")
    
    # Certification et quiz
    certificat_delivre = models.BooleanField(default=True, verbose_name="Certificat délivré")
    quiz_requis = models.BooleanField(default=False, verbose_name="Quiz requis")
    note_minimale = models.PositiveIntegerField(
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Note minimale pour certification"
    )
    
    # Statut et gestion
    status = models.CharField(max_length=20, choices=STATUTS, default='brouillon', verbose_name="Statut")
    est_featured = models.BooleanField(default=False, verbose_name="Formation mise en avant")
    
    # Relations
    created_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT, 
        related_name='formations_creees',
        verbose_name="Créé par"
    )
    participants = models.ManyToManyField(
        User, 
        through='InscriptionFormation', 
        related_name='formations',
        verbose_name="Participants"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Formation"
        verbose_name_plural = "Formations"
        ordering = ['-date_debut']
        indexes = [
            models.Index(fields=['categorie', 'niveau']),
            models.Index(fields=['date_debut', 'date_fin']),
            models.Index(fields=['status', 'est_en_ligne']),
        ]
    
    def __str__(self):
        return self.titre
    
    def save(self, *args, **kwargs):
        # Génération automatique du slug
        if not self.slug:
            base_slug = slugify(self.titre)
            slug = base_slug
            counter = 1
            while Formation.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # Définir la date limite d'inscription par défaut
        if not self.date_limite_inscription:
            self.date_limite_inscription = self.date_debut - timedelta(days=1)
        
        super().save(*args, **kwargs)
    
    @property
    def places_disponibles(self):
        """Nombre de places disponibles"""
        inscriptions_confirmees = self.inscriptions.filter(
            statut__in=['confirmee', 'en_cours', 'terminee']
        ).count()
        return max(0, self.max_participants - inscriptions_confirmees)
    
    @property
    def est_complete(self):
        """Vérifie si la formation est complète"""
        return self.places_disponibles <= 0
    
    @property
    def est_ouverte(self):
        """Vérifie si la formation est en cours"""
        now = timezone.now()
        return self.date_debut <= now <= self.date_fin
    
    @property
    def est_passee(self):
        """Vérifie si la formation est passée"""
        return timezone.now() > self.date_fin
    
    @property
    def peut_s_inscrire(self):
        """Vérifie si on peut s'inscrire à la formation"""
        now = timezone.now()
        return (
            self.inscription_ouverte and
            self.status == 'active' and
            (not self.date_limite_inscription or now <= self.date_limite_inscription) and
            not self.est_complete and
            not self.est_passee
        )


class ModuleFormation(models.Model):
    """Modèle pour les modules de formation"""
    
    formation = models.ForeignKey(
        Formation, 
        on_delete=models.CASCADE, 
        related_name='modules',
        verbose_name="Formation"
    )
    titre = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    ordre = models.PositiveIntegerField(verbose_name="Ordre")
    
    # Contenu
    duree_minutes = models.PositiveIntegerField(verbose_name="Durée en minutes")
    contenu = models.TextField(verbose_name="Contenu")
    objectifs = models.JSONField(default=default_empty_list, blank=True, verbose_name="Objectifs du module")  # CORRECTION: fonction nommée
    
    # Ressources
    video_url = models.URLField(blank=True, verbose_name="URL de la vidéo")
    documents_url = models.JSONField(default=default_empty_list, verbose_name="Documents")  # CORRECTION: fonction nommée
    ressources_supplementaires = models.TextField(blank=True, verbose_name="Ressources supplémentaires")
    
    # Quiz associé
    quiz = models.ForeignKey(
        'quiz.Quiz', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Quiz"
    )
    quiz_requis = models.BooleanField(default=False, verbose_name="Quiz requis")
    
    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Module de formation"
        verbose_name_plural = "Modules de formation"
        ordering = ['formation', 'ordre']
        unique_together = ['formation', 'ordre']
        indexes = [
            models.Index(fields=['formation', 'ordre']),
        ]
    
    def __str__(self):
        return f"{self.formation.titre} - Module {self.ordre}: {self.titre}"


# Alias pour compatibilité avec l'ancien nom
Module = ModuleFormation


class InscriptionFormation(models.Model):
    """Modèle pour les inscriptions aux formations"""
    
    STATUTS = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('abandonnee', 'Abandonnée'),
        ('annulee', 'Annulée'),
    ]
    
    # Relations principales
    formation = models.ForeignKey(
        Formation, 
        on_delete=models.CASCADE,
        related_name='inscriptions',
        verbose_name="Formation"
    )
    participante = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='inscriptions_formations',
        verbose_name="Participante"
    )
    
    # Dates
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    date_validation = models.DateTimeField(null=True, blank=True, verbose_name="Date de validation")
    date_debut = models.DateTimeField(null=True, blank=True, verbose_name="Date de début")
    date_completion = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin")
    
    # Statut et progression
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente', verbose_name="Statut")
    progression = models.PositiveIntegerField(
        default=0, 
        validators=[MaxValueValidator(100)],
        verbose_name="Progression (%)"
    )
    
    # Modules et temps
    modules_completes = models.ManyToManyField(
        ModuleFormation,
        blank=True,
        related_name='inscriptions_completees',
        verbose_name="Modules complétés"
    )
    temps_passe = models.DurationField(default=default_timedelta, verbose_name="Temps passé")  # CORRECTION: fonction nommée
    derniere_activite = models.DateTimeField(auto_now=True, verbose_name="Dernière activité")
    
    # Évaluation
    evaluation_formation = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Évaluation (1-5)"
    )
    commentaire_evaluation = models.TextField(blank=True, verbose_name="Commentaire d'évaluation")
    
    # Certification
    certificat_genere = models.BooleanField(default=False, verbose_name="Certificat généré")
    note_finale = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Note finale"
    )
    
    # Notes privées (pour les formateurs)
    notes_privees = models.TextField(blank=True, verbose_name="Notes privées")
    
    class Meta:
        verbose_name = "Inscription à une formation"
        verbose_name_plural = "Inscriptions aux formations"
        unique_together = ['formation', 'participante']
        indexes = [
            models.Index(fields=['statut', 'progression']),
            models.Index(fields=['date_inscription']),
            models.Index(fields=['formation', 'statut']),
        ]
    
    def __str__(self):
        return f"{self.participante.get_full_name()} - {self.formation.titre}"
    
    def calculer_progression(self):
        """Calcule la progression basée sur les modules complétés"""
        total_modules = self.formation.modules.count()
        if total_modules == 0:
            return 100 if self.statut == 'terminee' else 0
        
        modules_completes = self.modules_completes.count()
        return round((modules_completes / total_modules) * 100, 2)
    
    def peut_obtenir_certificat(self):
        """Vérifie si l'inscription peut obtenir un certificat"""
        if not self.formation.certificat_delivre:
            return False
        
        if self.statut != 'terminee':
            return False
        
        if self.formation.quiz_requis and self.note_finale:
            return self.note_finale >= self.formation.note_minimale
        
        return True
    
    def save(self, *args, **kwargs):
        # Calculer automatiquement la progression
        super().save(*args, **kwargs)
        nouvelle_progression = self.calculer_progression()
        if nouvelle_progression != self.progression:
            self.progression = nouvelle_progression
            super().save(update_fields=['progression'])


class Certificat(models.Model):
    """Modèle pour les certificats de formation"""
    
    inscription = models.OneToOneField(
        InscriptionFormation, 
        on_delete=models.CASCADE,
        related_name='certificat',
        verbose_name="Inscription"
    )
    
    # Identification
    numero_certificat = models.CharField(max_length=50, unique=True, verbose_name="Numéro de certificat")
    hash_verification = models.CharField(max_length=64, verbose_name="Hash de vérification")
    
    # Dates
    date_generation = models.DateTimeField(auto_now_add=True, verbose_name="Date de génération")
    date_expiration = models.DateTimeField(null=True, blank=True, verbose_name="Date d'expiration")
    
    # Statut
    est_valide = models.BooleanField(default=True, verbose_name="Certificat valide")
    raison_invalidation = models.TextField(blank=True, verbose_name="Raison d'invalidation")
    
    # Métadonnées
    fichier_pdf = models.FileField(upload_to='certificats/', blank=True, verbose_name="Fichier PDF")
    
    class Meta:
        verbose_name = "Certificat"
        verbose_name_plural = "Certificats"
        ordering = ['-date_generation']
    
    def __str__(self):
        return f"Certificat {self.numero_certificat} - {self.inscription.participante.get_full_name()}"
    
    def save(self, *args, **kwargs):
        # Générer le numéro de certificat automatiquement
        if not self.numero_certificat:
            self.generer_numero()
        
        # Générer le hash de vérification
        if not self.hash_verification:
            self.generer_hash()
        
        super().save(*args, **kwargs)
    
    def generer_numero(self):
        """Génère un numéro de certificat unique"""
        timestamp = timezone.now().strftime('%Y%m%d')
        formation_code = self.inscription.formation.categorie.upper()[:3]
        user_id = str(self.inscription.participante.id)[:4].zfill(4)
        
        self.numero_certificat = f"CERT-{formation_code}-{timestamp}-{user_id}"
    
    def generer_hash(self):
        """Génère un hash de vérification"""
        data = f"{self.numero_certificat}_{self.inscription.id}_{self.date_generation}"
        self.hash_verification = hashlib.sha256(data.encode()).hexdigest()
    
    def verifier_authenticite(self, hash_fourni):
        """Vérifie l'authenticité du certificat"""
        return self.hash_verification == hash_fourni and self.est_valide