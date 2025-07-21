# ============================================================================
# backend/quiz/models.py - CORRECTION LAMBDA
# ============================================================================
"""
Modèles pour le module quiz
CORRECTION: Remplacement des lambdas par des fonctions nommées
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


def default_empty_dict():
    """Fonction pour générer un dictionnaire vide par défaut"""
    return {}


class Quiz(models.Model):
    """Modèle principal pour les quiz"""
    
    TYPES = [
        ('evaluation', 'Évaluation'),
        ('certification', 'Certification'),
        ('pratique', 'Pratique'),
    ]
    
    titre = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    type_quiz = models.CharField(max_length=20, choices=TYPES, default='evaluation', verbose_name="Type de quiz")
    duree_minutes = models.PositiveIntegerField(default=30, verbose_name="Durée en minutes")
    note_passage = models.PositiveIntegerField(
        default=70, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Note de passage (%)"
    )
    tentatives_max = models.PositiveIntegerField(default=3, verbose_name="Nombre maximum de tentatives")
    melanger_questions = models.BooleanField(default=True, verbose_name="Mélanger les questions")
    afficher_correction = models.BooleanField(default=True, verbose_name="Afficher la correction")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        verbose_name="Créé par"
    )
    
    class Meta:
        verbose_name = "Quiz"
        verbose_name_plural = "Quiz"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.titre
    
    @property
    def nb_questions(self):
        """Nombre de questions dans le quiz"""
        return self.questions.count()
    
    @property
    def points_total(self):
        """Total des points possibles"""
        return sum(q.points for q in self.questions.all())


class Question(models.Model):
    """Modèle pour les questions de quiz"""
    
    TYPES = [
        ('qcm', 'QCM'),
        ('vrai_faux', 'Vrai/Faux'),
        ('texte', 'Réponse libre'),
        ('numerique', 'Numérique'),
    ]
    
    quiz = models.ForeignKey(
        Quiz, 
        on_delete=models.CASCADE, 
        related_name='questions',
        verbose_name="Quiz"
    )
    type_question = models.CharField(max_length=20, choices=TYPES, verbose_name="Type de question")
    enonce = models.TextField(verbose_name="Énoncé")
    points = models.PositiveIntegerField(default=1, verbose_name="Points")
    ordre = models.PositiveIntegerField(verbose_name="Ordre")
    explication = models.TextField(blank=True, verbose_name="Explication")
    
    class Meta:
        verbose_name = "Question"
        verbose_name_plural = "Questions"
        ordering = ['ordre']
        unique_together = ['quiz', 'ordre']
    
    def __str__(self):
        return f"Q{self.ordre}: {self.enonce[:50]}..."


class Reponse(models.Model):
    """Modèle pour les réponses possibles à une question"""
    
    question = models.ForeignKey(
        Question, 
        on_delete=models.CASCADE, 
        related_name='reponses',
        verbose_name="Question"
    )
    texte = models.TextField(verbose_name="Texte de la réponse")
    est_correcte = models.BooleanField(default=False, verbose_name="Réponse correcte")
    ordre = models.PositiveIntegerField(verbose_name="Ordre")
    
    class Meta:
        verbose_name = "Réponse"
        verbose_name_plural = "Réponses"
        ordering = ['ordre']
    
    def __str__(self):
        return f"{self.texte[:30]}... ({'✓' if self.est_correcte else '✗'})"


class TentativeQuiz(models.Model):
    """Modèle pour les tentatives de quiz"""
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, verbose_name="Quiz")
    participante = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Participante")
    numero_tentative = models.PositiveIntegerField(verbose_name="Numéro de tentative")
    
    # Dates
    date_debut = models.DateTimeField(auto_now_add=True, verbose_name="Date de début")
    date_fin = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin")
    
    # Résultats
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Score (%)"
    )
    reponses_donnees = models.JSONField(default=default_empty_dict, verbose_name="Réponses données")  # CORRECTION: fonction nommée
    temps_ecoule = models.DurationField(null=True, blank=True, verbose_name="Temps écoulé")
    est_valide = models.BooleanField(default=True, verbose_name="Tentative valide")
    
    class Meta:
        verbose_name = "Tentative de quiz"
        verbose_name_plural = "Tentatives de quiz"
        unique_together = ['quiz', 'participante', 'numero_tentative']
        indexes = [
            models.Index(fields=['score', 'date_fin']),
        ]
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"{self.participante.get_full_name()} - {self.quiz.titre} (Tentative {self.numero_tentative})"
    
    @property
    def est_reussie(self):
        """Vérifie si la tentative est réussie"""
        if self.score is None or not self.date_fin:
            return None
        return self.score >= self.quiz.note_passage
    
    @property
    def est_en_cours(self):
        """Vérifie si la tentative est en cours"""
        return self.date_fin is None
    
    @property
    def duree_reelle(self):
        """Durée réelle de la tentative"""
        if self.date_fin:
            return self.date_fin - self.date_debut
        else:
            from django.utils import timezone
            return timezone.now() - self.date_debut