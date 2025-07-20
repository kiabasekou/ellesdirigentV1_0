from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()

class Quiz(models.Model):
    TYPES = [
        ('evaluation', 'Évaluation'),
        ('certification', 'Certification'),
        ('pratique', 'Pratique'),
    ]
    
    titre = models.CharField(max_length=200)
    description = models.TextField()
    type_quiz = models.CharField(max_length=20, choices=TYPES, default='evaluation')
    duree_minutes = models.PositiveIntegerField(default=30)
    note_passage = models.PositiveIntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)])
    tentatives_max = models.PositiveIntegerField(default=3)
    melanger_questions = models.BooleanField(default=True)
    afficher_correction = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return self.titre

class Question(models.Model):
    TYPES = [
        ('qcm', 'QCM'),
        ('vrai_faux', 'Vrai/Faux'),
        ('texte', 'Réponse libre'),
        ('numerique', 'Numérique'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    type_question = models.CharField(max_length=20, choices=TYPES)
    enonce = models.TextField()
    points = models.PositiveIntegerField(default=1)
    ordre = models.PositiveIntegerField()
    explication = models.TextField(blank=True)
    
    class Meta:
        ordering = ['ordre']
        unique_together = ['quiz', 'ordre']

class Reponse(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='reponses')
    texte = models.TextField()
    est_correcte = models.BooleanField(default=False)
    ordre = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['ordre']

class TentativeQuiz(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    participante = models.ForeignKey(User, on_delete=models.CASCADE)
    numero_tentative = models.PositiveIntegerField()
    date_debut = models.DateTimeField(auto_now_add=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    reponses_donnees = models.JSONField(default=dict)
    temps_ecoule = models.DurationField(null=True, blank=True)
    est_valide = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['quiz', 'participante', 'numero_tentative']
        indexes = [
            models.Index(fields=['score', 'date_fin']),
        ]