
# ============================================================================
# backend/training/models.py (CORRECTION des imports)
# ============================================================================
"""
CORRECTION: Utilisation du bon modèle utilisateur
"""
from django.db import models
from django.contrib.auth import get_user_model  # CORRECTION
from django.core.validators import MaxValueValidator
from django.utils import timezone
from datetime import timedelta

# CORRECTION: Utilisation du modèle utilisateur personnalisé
User = get_user_model()


class Formation(models.Model):
    CATEGORIES = [
        ('communication', 'Communication'),
        ('gouvernance', 'Gouvernance'),
        ('campagne', 'Campagne Électorale'),
        ('droits_femmes', 'Droits des Femmes'),
    ]
    
    NIVEAUX = [
        ('debutant', 'Débutant'),
        ('intermediaire', 'Intermédiaire'),
        ('avance', 'Avancé'),
    ]
    
    STATUTS = [
        ('brouillon', 'Brouillon'),
        ('published', 'Publié'),
        ('archive', 'Archivé'),
    ]
    
    titre = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    categorie = models.CharField(max_length=20, choices=CATEGORIES)
    niveau = models.CharField(max_length=20, choices=NIVEAUX, default='debutant')
    duree_heures = models.PositiveIntegerField()
    
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    lieu = models.CharField(max_length=300, blank=True)
    est_en_ligne = models.BooleanField(default=False)
    
    max_participants = models.PositiveIntegerField()
    cout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    formateur = models.CharField(max_length=200)
    image_cover = models.ImageField(upload_to='formations/', blank=True)
    certificat_delivre = models.BooleanField(default=True)
    quiz_requis = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUTS, default='brouillon')
    
    # CORRECTION: Utilisation du modèle User personnalisé
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='formations_creees')
    participants = models.ManyToManyField(User, through='InscriptionFormation', related_name='formations')
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_debut']
    
    def __str__(self):
        return self.titre
    
    @property
    def places_disponibles(self):
        return self.max_participants - self.participants.count()
    
    @property
    def est_complete(self):
        return self.places_disponibles <= 0
    
    @property
    def est_ouverte(self):
        now = timezone.now()
        return self.date_debut <= now <= self.date_fin


class Module(models.Model):
    formation = models.ForeignKey(Formation, on_delete=models.CASCADE, related_name='modules')
    titre = models.CharField(max_length=200)
    description = models.TextField()
    ordre = models.PositiveIntegerField()
    duree_minutes = models.PositiveIntegerField()
    contenu = models.TextField()
    video_url = models.URLField(blank=True)
    documents_url = models.JSONField(default=list)
    quiz = models.ForeignKey('quiz.Quiz', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['ordre']
        unique_together = ['formation', 'ordre']


class InscriptionFormation(models.Model):
    STATUTS = [
        ('inscrite', 'Inscrite'),
        ('confirmee', 'Confirmée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('abandonnee', 'Abandonnée'),
        ('certifiee', 'Certifiée'),
    ]
    
    formation = models.ForeignKey(Formation, on_delete=models.CASCADE)
    # CORRECTION: Utilisation du modèle User personnalisé
    participante = models.ForeignKey(User, on_delete=models.CASCADE)
    date_inscription = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='inscrite')
    
    progression = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)])
    modules_completes = models.JSONField(default=list)
    temps_passe = models.DurationField(default=timedelta)
    
    certificat_genere = models.BooleanField(default=False)
    date_completion = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['formation', 'participante']
    
    def calculer_progression(self):
        """Calcule la progression basée sur les modules complétés"""
        total_modules = self.formation.modules.count()
        if total_modules == 0:
            return 0
        return (len(self.modules_completes) / total_modules) * 100


class Certificat(models.Model):
    inscription = models.OneToOneField(InscriptionFormation, on_delete=models.CASCADE)
    numero_certificat = models.CharField(max_length=50, unique=True)
    date_generation = models.DateTimeField(auto_now_add=True)
    hash_verification = models.CharField(max_length=64)
    
    def __str__(self):
        return f"Certificat {self.numero_certificat}"