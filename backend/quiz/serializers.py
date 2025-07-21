# ============================================================================
# backend/quiz/serializers.py - CORRECTION COMPLÈTE
# ============================================================================
"""
Serializers pour le module quiz
CORRECTION: Amélioration et completion des serializers
"""
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Avg, Count

from .models import Quiz, Question, Reponse, TentativeQuiz


class ReponseSerializer(serializers.ModelSerializer):
    """Serializer pour les réponses (sans révéler la bonne réponse)"""
    
    class Meta:
        model = Reponse
        fields = ['id', 'texte', 'ordre']


class ReponseDetailSerializer(ReponseSerializer):
    """Serializer détaillé avec la bonne réponse (pour corrections)"""
    
    class Meta(ReponseSerializer.Meta):
        fields = ReponseSerializer.Meta.fields + ['est_correcte']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer pour les questions"""
    
    reponses = ReponseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'type_question', 'enonce', 'points', 
            'ordre', 'reponses'
        ]


class QuestionDetailSerializer(QuestionSerializer):
    """Serializer détaillé avec explications et corrections"""
    
    reponses = ReponseDetailSerializer(many=True, read_only=True)
    
    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + ['explication']


class QuestionCreationSerializer(serializers.ModelSerializer):
    """Serializer pour la création de questions avec réponses"""
    
    reponses_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True,
        min_length=1
    )
    
    class Meta:
        model = Question
        fields = [
            'type_question', 'enonce', 'points', 'ordre', 
            'explication', 'reponses_data'
        ]
    
    def validate_reponses_data(self, value):
        """Valide les données des réponses"""
        if not value:
            raise serializers.ValidationError("Au moins une réponse est requise")
        
        # Vérifier qu'il y a au moins une bonne réponse
        bonnes_reponses = [r for r in value if r.get('est_correcte', False)]
        if not bonnes_reponses:
            raise serializers.ValidationError("Au moins une réponse correcte est requise")
        
        return value
    
    def create(self, validated_data):
        """Création avec réponses associées"""
        reponses_data = validated_data.pop('reponses_data')
        
        # Créer la question
        question = Question.objects.create(**validated_data)
        
        # Créer les réponses
        for i, reponse_data in enumerate(reponses_data, 1):
            Reponse.objects.create(
                question=question,
                texte=reponse_data['texte'],
                est_correcte=reponse_data.get('est_correcte', False),
                ordre=i
            )
        
        return question


class QuizSerializer(serializers.ModelSerializer):
    """Serializer principal pour les quiz"""
    
    questions_count = serializers.SerializerMethodField()
    points_total = serializers.SerializerMethodField()
    created_by_nom = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Statistiques utilisateur
    user_tentatives_count = serializers.SerializerMethodField()
    user_meilleur_score = serializers.SerializerMethodField()
    user_peut_recommencer = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'titre', 'description', 'type_quiz', 'duree_minutes',
            'note_passage', 'tentatives_max', 'melanger_questions',
            'afficher_correction', 'created_at', 'created_by_nom',
            'questions_count', 'points_total', 'user_tentatives_count',
            'user_meilleur_score', 'user_peut_recommencer'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_questions_count(self, obj):
        """Nombre de questions"""
        return obj.questions.count()
    
    def get_points_total(self, obj):
        """Total des points possibles"""
        return sum(q.points for q in obj.questions.all())
    
    def get_user_tentatives_count(self, obj):
        """Nombre de tentatives de l'utilisateur connecté"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.tentativequiz_set.filter(participante=request.user).count()
        return 0
    
    def get_user_meilleur_score(self, obj):
        """Meilleur score de l'utilisateur connecté"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            tentatives = obj.tentativequiz_set.filter(
                participante=request.user,
                date_fin__isnull=False
            )
            if tentatives.exists():
                return tentatives.aggregate(
                    meilleur=models.Max('score')
                )['meilleur']
        return None
    
    def get_user_peut_recommencer(self, obj):
        """Vérifie si l'utilisateur peut recommencer le quiz"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            tentatives_count = self.get_user_tentatives_count(obj)
            return tentatives_count < obj.tentatives_max
        return False


class QuizDetailSerializer(QuizSerializer):
    """Serializer détaillé avec questions"""
    
    questions = QuestionSerializer(many=True, read_only=True)
    user_tentatives = serializers.SerializerMethodField()
    statistiques = serializers.SerializerMethodField()
    
    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + [
            'questions', 'user_tentatives', 'statistiques'
        ]
    
    def get_user_tentatives(self, obj):
        """Tentatives de l'utilisateur connecté"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            tentatives = obj.tentativequiz_set.filter(
                participante=request.user
            ).order_by('-numero_tentative')
            return TentativeQuizSerializer(tentatives, many=True).data
        return []
    
    def get_statistiques(self, obj):
        """Statistiques générales du quiz"""
        tentatives = obj.tentativequiz_set.filter(date_fin__isnull=False)
        
        if not tentatives.exists():
            return {
                'total_tentatives': 0,
                'score_moyen': 0,
                'taux_reussite': 0,
                'temps_moyen': None
            }
        
        reussites = tentatives.filter(score__gte=obj.note_passage)
        
        return {
            'total_tentatives': tentatives.count(),
            'score_moyen': round(tentatives.aggregate(
                moyenne=Avg('score')
            )['moyenne'], 2),
            'taux_reussite': round(
                (reussites.count() / tentatives.count()) * 100, 2
            ),
            'temps_moyen': tentatives.aggregate(
                moyenne=Avg('temps_ecoule')
            )['moyenne']
        }


class TentativeQuizSerializer(serializers.ModelSerializer):
    """Serializer pour les tentatives de quiz"""
    
    quiz_titre = serializers.CharField(source='quiz.titre', read_only=True)
    quiz_note_passage = serializers.IntegerField(source='quiz.note_passage', read_only=True)
    participante_nom = serializers.CharField(source='participante.get_full_name', read_only=True)
    
    # Champs calculés
    est_reussie = serializers.SerializerMethodField()
    est_en_cours = serializers.SerializerMethodField()
    temps_restant = serializers.SerializerMethodField()
    
    class Meta:
        model = TentativeQuiz
        fields = [
            'id', 'quiz', 'participante', 'numero_tentative',
            'date_debut', 'date_fin', 'score', 'reponses_donnees',
            'temps_ecoule', 'est_valide', 'quiz_titre', 'quiz_note_passage',
            'participante_nom', 'est_reussie', 'est_en_cours', 'temps_restant'
        ]
        read_only_fields = [
            'id', 'numero_tentative', 'score', 'temps_ecoule',
            'quiz_titre', 'quiz_note_passage', 'participante_nom',
            'est_reussie', 'est_en_cours', 'temps_restant'
        ]
    
    def get_est_reussie(self, obj):
        """Vérifie si la tentative est réussie"""
        if obj.score is None or not obj.date_fin:
            return None
        return obj.score >= obj.quiz.note_passage
    
    def get_est_en_cours(self, obj):
        """Vérifie si la tentative est en cours"""
        return obj.date_fin is None
    
    def get_temps_restant(self, obj):
        """Calcule le temps restant (en secondes)"""
        if obj.date_fin:
            return 0
        
        temps_ecoule = timezone.now() - obj.date_debut
        temps_limite = obj.quiz.duree_minutes * 60
        temps_restant = temps_limite - temps_ecoule.total_seconds()
        
        return max(0, int(temps_restant))


class QuizCreationSerializer(serializers.ModelSerializer):
    """Serializer pour la création de quiz avec questions"""
    
    questions_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Quiz
        fields = [
            'titre', 'description', 'type_quiz', 'duree_minutes',
            'note_passage', 'tentatives_max', 'melanger_questions',
            'afficher_correction', 'questions_data'
        ]
    
    def create(self, validated_data):
        """Création avec questions et réponses"""
        questions_data = validated_data.pop('questions_data', [])
        
        # Créer le quiz
        quiz = Quiz.objects.create(**validated_data)
        
        # Créer les questions
        for ordre, question_data in enumerate(questions_data, 1):
            reponses_data = question_data.pop('reponses_data', [])
            
            question = Question.objects.create(
                quiz=quiz,
                ordre=ordre,
                **question_data
            )
            
            # Créer les réponses
            for ordre_reponse, reponse_data in enumerate(reponses_data, 1):
                Reponse.objects.create(
                    question=question,
                    ordre=ordre_reponse,
                    **reponse_data
                )
        
        return quiz


class QuizStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques de quiz"""
    
    total_quiz = serializers.IntegerField()
    total_tentatives = serializers.IntegerField()
    tentatives_reussies = serializers.IntegerField()
    score_moyen_global = serializers.FloatField()
    taux_reussite_global = serializers.FloatField()
    quiz_populaires = QuizSerializer(many=True)
    repartition_par_type = serializers.DictField()


class ReponseSubmissionSerializer(serializers.Serializer):
    """Serializer pour la soumission de réponses"""
    
    reponses = serializers.DictField(
        help_text="Dictionnaire question_id -> reponse_id ou valeur"
    )
    
    def validate_reponses(self, value):
        """Valide le format des réponses"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Les réponses doivent être un dictionnaire")
        
        return value


class QuizRapideSerializer(serializers.ModelSerializer):
    """Serializer minimal pour les références rapides"""
    
    created_by_nom = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'titre', 'type_quiz', 'duree_minutes',
            'questions_count', 'created_by_nom'
        ]
    
    questions_count = serializers.SerializerMethodField()
    
    def get_questions_count(self, obj):
        return getattr(obj, 'questions_count', obj.questions.count())