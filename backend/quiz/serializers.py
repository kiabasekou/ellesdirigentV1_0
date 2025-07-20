from rest_framework import serializers
from .models import Quiz, Question, Reponse, TentativeQuiz

class ReponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reponse
        fields = ['id', 'texte', 'ordre']

class ReponseDetailSerializer(ReponseSerializer):
    class Meta(ReponseSerializer.Meta):
        fields = ReponseSerializer.Meta.fields + ['est_correcte']

class QuestionSerializer(serializers.ModelSerializer):
    reponses = ReponseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'type_question', 'enonce', 'points', 'ordre', 'reponses']

class QuestionDetailSerializer(QuestionSerializer):
    reponses = ReponseDetailSerializer(many=True, read_only=True)
    
    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + ['explication']

class QuizSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()
    points_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'titre', 'description', 'type_quiz', 'duree_minutes',
            'note_passage', 'tentatives_max', 'questions_count', 'points_total'
        ]
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    
    def get_points_total(self, obj):
        return sum(q.points for q in obj.questions.all())

class QuizDetailSerializer(QuizSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    user_tentatives = serializers.SerializerMethodField()
    
    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ['questions', 'melanger_questions', 'afficher_correction', 'user_tentatives']
    
    def get_user_tentatives(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            tentatives = TentativeQuiz.objects.filter(
                quiz=obj, participante=request.user
            ).order_by('-numero_tentative')
            return TentativeQuizSerializer(tentatives, many=True).data
        return []

class TentativeQuizSerializer(serializers.ModelSerializer):
    quiz_titre = serializers.CharField(source='quiz.titre', read_only=True)
    est_reussie = serializers.SerializerMethodField()
    
    class Meta:
        model = TentativeQuiz
        fields = '__all__'
        read_only_fields = ['numero_tentative', 'score', 'temps_ecoule']
    
    def get_est_reussie(self, obj):
        if obj.score is None:
            return None
        return obj.score >= obj.quiz.note_passage