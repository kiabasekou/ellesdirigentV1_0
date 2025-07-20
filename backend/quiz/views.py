from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Quiz, TentativeQuiz
from .serializers import QuizSerializer, QuizDetailSerializer, TentativeQuizSerializer

class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quiz.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer
    
    @action(detail=True, methods=['post'])
    def commencer(self, request, pk=None):
        quiz = self.get_object()
        
        # Vérifier le nombre de tentatives
        tentatives_count = TentativeQuiz.objects.filter(
            quiz=quiz, participante=request.user
        ).count()
        
        if tentatives_count >= quiz.tentatives_max:
            return Response(
                {'error': f'Nombre maximum de tentatives atteint ({quiz.tentatives_max})'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer nouvelle tentative
        tentative = TentativeQuiz.objects.create(
            quiz=quiz,
            participante=request.user,
            numero_tentative=tentatives_count + 1
        )
        
        serializer = TentativeQuizSerializer(tentative)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def soumettre(self, request, pk=None):
        quiz = self.get_object()
        reponses = request.data.get('reponses', {})
        
        # Récupérer la tentative en cours
        try:
            tentative = TentativeQuiz.objects.get(
                quiz=quiz,
                participante=request.user,
                date_fin__isnull=True
            )
        except TentativeQuiz.DoesNotExist:
            return Response(
                {'error': 'Aucune tentative en cours'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculer le score
        score = 0
        points_total = 0
        
        for question in quiz.questions.all():
            points_total += question.points
            reponse_donnee = reponses.get(str(question.id))
            
            if question.type_question == 'qcm':
                reponse_correcte = question.reponses.filter(est_correcte=True).first()
                if reponse_correcte and str(reponse_correcte.id) == str(reponse_donnee):
                    score += question.points
            elif question.type_question == 'vrai_faux':
                reponse_correcte = question.reponses.filter(est_correcte=True).first()
                if reponse_correcte and str(reponse_correcte.id) == str(reponse_donnee):
                    score += question.points
        
        # Calculer le pourcentage
        score_pourcentage = (score / points_total * 100) if points_total > 0 else 0
        
        # Finaliser la tentative
        tentative.date_fin = timezone.now()
        tentative.score = score_pourcentage
        tentative.reponses_donnees = reponses
        tentative.temps_ecoule = tentative.date_fin - tentative.date_debut
        tentative.save()
        
        return Response({
            'score': score_pourcentage,
            'points': score,
            'points_total': points_total,
            'reussi': score_pourcentage >= quiz.note_passage,
            'tentative': TentativeQuizSerializer(tentative).data
        })