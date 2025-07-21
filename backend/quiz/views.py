# ============================================================================
# backend/quiz/views.py - CORRECTION COMPLÈTE
# ============================================================================
"""
Vues pour le module quiz
CORRECTION: Ajout de TentativeQuizViewSet manquant
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Avg, Q
from datetime import timedelta

from .models import Quiz, TentativeQuiz, Question, Reponse
from .serializers import (
    QuizSerializer, 
    QuizDetailSerializer, 
    TentativeQuizSerializer,
    QuestionSerializer,
    ReponseSerializer
)


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la gestion des quiz"""
    
    queryset = Quiz.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer
    
    def get_queryset(self):
        """Filtre les quiz selon les permissions"""
        queryset = Quiz.objects.prefetch_related('questions__reponses')
        
        # Filtrer par type si spécifié
        type_quiz = self.request.query_params.get('type')
        if type_quiz:
            queryset = queryset.filter(type_quiz=type_quiz)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def commencer(self, request, pk=None):
        """Commencer un nouveau quiz"""
        quiz = self.get_object()
        
        # Vérifier le nombre de tentatives
        tentatives_count = TentativeQuiz.objects.filter(
            quiz=quiz, 
            participante=request.user
        ).count()
        
        if tentatives_count >= quiz.tentatives_max:
            return Response(
                {'error': f'Nombre maximum de tentatives atteint ({quiz.tentatives_max})'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier s'il y a déjà une tentative en cours
        tentative_en_cours = TentativeQuiz.objects.filter(
            quiz=quiz,
            participante=request.user,
            date_fin__isnull=True
        ).first()
        
        if tentative_en_cours:
            # Retourner la tentative en cours
            serializer = TentativeQuizSerializer(tentative_en_cours)
            return Response({
                'message': 'Tentative en cours trouvée',
                'tentative': serializer.data
            })
        
        # Créer nouvelle tentative
        tentative = TentativeQuiz.objects.create(
            quiz=quiz,
            participante=request.user,
            numero_tentative=tentatives_count + 1
        )
        
        serializer = TentativeQuizSerializer(tentative)
        return Response({
            'message': 'Nouvelle tentative créée',
            'tentative': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def soumettre(self, request, pk=None):
        """Soumettre les réponses d'un quiz"""
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
                {'error': 'Aucune tentative en cours trouvée'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le temps limite
        temps_ecoule = timezone.now() - tentative.date_debut
        if temps_ecoule.total_seconds() > quiz.duree_minutes * 60:
            # Marquer comme invalide si temps dépassé
            tentative.est_valide = False
        
        # Calculer le score
        score = 0
        points_total = 0
        details_reponses = {}
        
        for question in quiz.questions.all():
            points_total += question.points
            reponse_donnee = reponses.get(str(question.id))
            question_correcte = False
            
            if question.type_question in ['qcm', 'vrai_faux']:
                reponse_correcte = question.reponses.filter(est_correcte=True).first()
                if reponse_correcte and str(reponse_correcte.id) == str(reponse_donnee):
                    score += question.points
                    question_correcte = True
            elif question.type_question == 'numerique':
                # Pour les questions numériques, comparer les valeurs
                try:
                    reponse_correcte = question.reponses.filter(est_correcte=True).first()
                    if reponse_correcte:
                        if float(reponse_donnee) == float(reponse_correcte.texte):
                            score += question.points
                            question_correcte = True
                except (ValueError, TypeError):
                    pass
            
            # Stocker les détails pour correction
            details_reponses[str(question.id)] = {
                'reponse_donnee': reponse_donnee,
                'est_correcte': question_correcte,
                'points_obtenus': question.points if question_correcte else 0
            }
        
        # Calculer le pourcentage
        score_pourcentage = (score / points_total * 100) if points_total > 0 else 0
        
        # Finaliser la tentative
        tentative.date_fin = timezone.now()
        tentative.score = score_pourcentage
        tentative.reponses_donnees = reponses
        tentative.temps_ecoule = tentative.date_fin - tentative.date_debut
        tentative.save()
        
        # Préparer la réponse
        response_data = {
            'score': score_pourcentage,
            'points_obtenus': score,
            'points_total': points_total,
            'reussi': score_pourcentage >= quiz.note_passage,
            'tentative': TentativeQuizSerializer(tentative).data,
            'temps_ecoule_secondes': tentative.temps_ecoule.total_seconds()
        }
        
        # Ajouter les corrections si autorisé
        if quiz.afficher_correction:
            response_data['corrections'] = details_reponses
        
        return Response(response_data)
    
    @action(detail=True, methods=['get'])
    def resultats(self, request, pk=None):
        """Obtenir les résultats d'un quiz pour l'utilisateur"""
        quiz = self.get_object()
        
        tentatives = TentativeQuiz.objects.filter(
            quiz=quiz,
            participante=request.user
        ).order_by('-numero_tentative')
        
        if not tentatives.exists():
            return Response({
                'message': 'Aucune tentative trouvée',
                'tentatives': []
            })
        
        serializer = TentativeQuizSerializer(tentatives, many=True)
        
        # Calculer les statistiques
        tentatives_finies = tentatives.filter(date_fin__isnull=False)
        
        stats = {
            'nombre_tentatives': tentatives.count(),
            'tentatives_finies': tentatives_finies.count(),
            'meilleur_score': tentatives_finies.aggregate(
                meilleur=models.Max('score')
            )['meilleur'],
            'dernier_score': tentatives.first().score if tentatives.exists() else None,
            'a_reussi': tentatives_finies.filter(
                score__gte=quiz.note_passage
            ).exists()
        }
        
        return Response({
            'tentatives': serializer.data,
            'statistiques': stats
        })
    
    @action(detail=False, methods=['get'])
    def mes_quiz(self, request):
        """Quiz auxquels l'utilisateur a participé"""
        quiz_ids = TentativeQuiz.objects.filter(
            participante=request.user
        ).values_list('quiz_id', flat=True).distinct()
        
        quiz = Quiz.objects.filter(id__in=quiz_ids)
        serializer = QuizSerializer(quiz, many=True)
        
        return Response(serializer.data)


class TentativeQuizViewSet(viewsets.ModelViewSet):
    """CORRECTION: ViewSet manquant pour les tentatives de quiz"""
    
    serializer_class = TentativeQuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les tentatives selon l'utilisateur"""
        if self.request.user.is_staff:
            return TentativeQuiz.objects.select_related(
                'quiz', 'participante'
            ).all()
        
        return TentativeQuiz.objects.select_related(
            'quiz', 'participante'
        ).filter(participante=self.request.user)
    
    def perform_create(self, serializer):
        """Associe automatiquement l'utilisateur connecté"""
        serializer.save(participante=self.request.user)
    
    @action(detail=True, methods=['post'])
    def abandonner(self, request, pk=None):
        """Abandonner une tentative en cours"""
        tentative = self.get_object()
        
        # Vérifier que c'est bien la tentative de l'utilisateur
        if tentative.participante != request.user:
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que la tentative n'est pas déjà finie
        if tentative.date_fin:
            return Response(
                {'error': 'Cette tentative est déjà terminée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Marquer comme abandonnée
        tentative.date_fin = timezone.now()
        tentative.score = 0
        tentative.temps_ecoule = tentative.date_fin - tentative.date_debut
        tentative.est_valide = False
        tentative.save()
        
        return Response({
            'message': 'Tentative abandonnée',
            'tentative': TentativeQuizSerializer(tentative).data
        })
    
    @action(detail=True, methods=['get'])
    def details_correction(self, request, pk=None):
        """Obtenir les détails de correction d'une tentative"""
        tentative = self.get_object()
        
        # Vérifier les permissions
        if tentative.participante != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que le quiz autorise l'affichage des corrections
        if not tentative.quiz.afficher_correction and not request.user.is_staff:
            return Response(
                {'error': 'Corrections non disponibles pour ce quiz'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que la tentative est terminée
        if not tentative.date_fin:
            return Response(
                {'error': 'Tentative non terminée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Construire les détails de correction
        corrections = []
        reponses_donnees = tentative.reponses_donnees
        
        for question in tentative.quiz.questions.all():
            reponse_donnee = reponses_donnees.get(str(question.id))
            reponses_correctes = question.reponses.filter(est_correcte=True)
            
            correction = {
                'question': QuestionSerializer(question).data,
                'reponse_donnee': reponse_donnee,
                'reponses_correctes': ReponseSerializer(reponses_correctes, many=True).data,
                'est_correcte': False,
                'points_obtenus': 0
            }
            
            # Vérifier si la réponse est correcte
            if question.type_question in ['qcm', 'vrai_faux']:
                if reponses_correctes.filter(id=reponse_donnee).exists():
                    correction['est_correcte'] = True
                    correction['points_obtenus'] = question.points
            elif question.type_question == 'numerique':
                try:
                    reponse_correcte = reponses_correctes.first()
                    if reponse_correcte and float(reponse_donnee) == float(reponse_correcte.texte):
                        correction['est_correcte'] = True
                        correction['points_obtenus'] = question.points
                except (ValueError, TypeError):
                    pass
            
            corrections.append(correction)
        
        return Response({
            'tentative': TentativeQuizSerializer(tentative).data,
            'corrections': corrections
        })
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques générales des tentatives"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = {
            'total_tentatives': TentativeQuiz.objects.count(),
            'tentatives_finies': TentativeQuiz.objects.filter(
                date_fin__isnull=False
            ).count(),
            'tentatives_reussies': TentativeQuiz.objects.filter(
                score__gte=models.F('quiz__note_passage'),
                date_fin__isnull=False
            ).count(),
            'score_moyen': TentativeQuiz.objects.filter(
                date_fin__isnull=False
            ).aggregate(
                moyenne=Avg('score')
            )['moyenne'],
            'temps_moyen': TentativeQuiz.objects.filter(
                date_fin__isnull=False,
                temps_ecoule__isnull=False
            ).aggregate(
                moyenne=Avg('temps_ecoule')
            )['moyenne']
        }
        
        # Quiz les plus populaires
        quiz_populaires = Quiz.objects.annotate(
            nb_tentatives=Count('tentativequiz')
        ).order_by('-nb_tentatives')[:5]
        
        stats['quiz_populaires'] = QuizSerializer(quiz_populaires, many=True).data
        
        return Response(stats)