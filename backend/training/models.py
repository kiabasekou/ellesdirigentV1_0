from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()

class Formation(models.Model):
    NIVEAUX = [
        ('debutant', 'Débutant'),
        ('intermediaire', 'Intermédiaire'),
        ('avance', 'Avancé'),
    ]
    
    CATEGORIES = [
        ('leadership', 'Leadership'),
        ('communication', 'Communication'),
        ('campagne', 'Campagne électorale'),
        ('gouvernance', 'Gouvernance'),
        ('negociation', 'Négociation'),
        ('droits_femmes', 'Droits des femmes'),
        ('economie', 'Économie politique'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('published', 'Publiée'),
        ('archived', 'Archivée'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True, max_length=220)
    description = models.TextField()
    objectifs = models.JSONField(default=list)
    prerequis = models.TextField(blank=True)
    
    categorie = models.CharField(max_length=50, choices=CATEGORIES, db_index=True)
    niveau = models.CharField(max_length=20, choices=NIVEAUX, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    duree_heures = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(200)])
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    lieu = models.CharField(max_length=200)
    est_en_ligne = models.BooleanField(default=False)
    lien_visio = models.URLField(blank=True)
    
    max_participants = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(500)])
    cout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    materiel_requis = models.TextField(blank=True)
    
    formateur = models.CharField(max_length=200)
    formateur_bio = models.TextField(blank=True)
    formateur_photo = models.ImageField(upload_to='formateurs/', blank=True)
    
    image_cover = models.ImageField(upload_to='formations/covers/', blank=True)
    documents = models.JSONField(default=list)
    
    certificat_delivre = models.BooleanField(default=True)
    quiz_requis = models.BooleanField(default=False)
    note_minimale = models.PositiveIntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    participants = models.ManyToManyField(User, through='InscriptionFormation', related_name='formations_suivies')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='formations_creees')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['categorie', 'niveau']),
            models.Index(fields=['date_debut', 'date_fin']),
            models.Index(fields=['status', 'est_en_ligne']),
        ]
    
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
    participante = models.ForeignKey(User, on_delete=models.CASCADE)
    date_inscription = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='inscrite')
    
    progression = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)])
    modules_completes = models.JSONField(default=list)
    temps_passe = models.DurationField(default=timedelta)
    
    note_finale = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    evaluation_formation = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire_evaluation = models.TextField(blank=True)
    
    certificat_genere = models.BooleanField(default=False)
    certificat_url = models.URLField(blank=True)
    date_completion = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['formation', 'participante']
        indexes = [
            models.Index(fields=['statut', 'progression']),
            models.Index(fields=['date_inscription']),
        ]
    
    def calculer_progression(self):
        modules_total = self.formation.modules.count()
        if modules_total == 0:
            return 0
        modules_completes = len(self.modules_completes)
        return int((modules_completes / modules_total) * 100)

class Certificat(models.Model):
    inscription = models.OneToOneField(InscriptionFormation, on_delete=models.CASCADE)
    numero_certificat = models.CharField(max_length=50, unique=True)
    date_generation = models.DateTimeField(auto_now_add=True)
    fichier_pdf = models.FileField(upload_to='certificats/')
    hash_verification = models.CharField(max_length=64)
    est_valide = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-date_generation']
    
    def save(self, *args, **kwargs):
        if not self.numero_certificat:
            self.numero_certificat = f"CERT-{timezone.now().year}-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)