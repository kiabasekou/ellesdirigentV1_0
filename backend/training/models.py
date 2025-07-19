# backend/training/models.py
from django.db import models
from users.models import Participante

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
    ]
    
    titre = models.CharField(max_length=200)
    description = models.TextField()
    categorie = models.CharField(max_length=50, choices=CATEGORIES)
    niveau = models.CharField(max_length=20, choices=NIVEAUX)
    duree_heures = models.PositiveIntegerField()
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    lieu = models.CharField(max_length=200)
    est_en_ligne = models.BooleanField(default=False)
    lien_visio = models.URLField(blank=True)
    max_participants = models.PositiveIntegerField()
    formateur = models.CharField(max_length=200)
    cout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    materiel_requis = models.TextField(blank=True)
    
    participants = models.ManyToManyField(
        Participante,
        through='InscriptionFormation',
        related_name='formations_suivies'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.titre

class InscriptionFormation(models.Model):
    STATUTS = [
        ('inscrite', 'Inscrite'),
        ('confirmee', 'Confirmée'),
        ('presente', 'Présente'),
        ('absente', 'Absente'),
        ('terminee', 'Terminée'),
    ]
    
    formation = models.ForeignKey(Formation, on_delete=models.CASCADE)
    participante = models.ForeignKey(Participante, on_delete=models.CASCADE)
    date_inscription = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='inscrite')
    note_evaluation = models.PositiveIntegerField(null=True, blank=True)  # /5
    commentaire = models.TextField(blank=True)
    certificat_delivre = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['formation', 'participante']