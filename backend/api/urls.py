# ============================================================================
# backend/api/urls.py - CORRECTION COMPLÈTE
# ============================================================================
"""
URLs pour l'API générale - Version corrigée
CORRECTION: Suppression des imports incorrects et restructuration
"""
from django.urls import path, include
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

app_name = 'api'


class APIRootView(APIView):
    """Vue racine de l'API avec informations générales"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, format=None):
        """Informations sur l'API"""
        return Response({
            'message': 'Bienvenue sur l\'API de la Plateforme Femmes en Politique',
            'version': '1.0',
            'endpoints': {
                'auth': '/api/auth/',
                'training': '/api/training/',
                'quiz': '/api/quiz/',
                'events': '/api/events/',
                'docs': '/swagger/',
            },
            'status': 'active'
        })


class APIHealthView(APIView):
    """Vue de vérification de l'état de l'API"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, format=None):
        """Status de santé de l'API"""
        from django.db import connection
        from django.utils import timezone
        
        try:
            # Test de connexion à la base de données
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            db_status = "healthy"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'database': db_status,
            'services': {
                'authentication': 'active',
                'training': 'active',
                'quiz': 'active',
                'events': 'active'
            }
        })


class APIStatsView(APIView):
    """Vue des statistiques générales de la plateforme"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, format=None):
        """Statistiques générales publiques"""
        from django.contrib.auth import get_user_model
        from django.db.models import Count
        
        User = get_user_model()
        
        try:
            # Importer les modèles dynamiquement pour éviter les erreurs si apps pas installées
            stats = {
                'users': {
                    'total': User.objects.count(),
                    'active': User.objects.filter(is_active=True).count()
                }
            }
            
            # Ajouter stats training si disponible
            try:
                from training.models import Formation, InscriptionFormation
                stats['training'] = {
                    'formations_total': Formation.objects.count(),
                    'formations_actives': Formation.objects.filter(status='active').count(),
                    'inscriptions_total': InscriptionFormation.objects.count()
                }
            except ImportError:
                stats['training'] = {'status': 'not_available'}
            
            # Ajouter stats quiz si disponible
            try:
                from quiz.models import Quiz, TentativeQuiz
                stats['quiz'] = {
                    'quiz_total': Quiz.objects.count(),
                    'tentatives_total': TentativeQuiz.objects.count()
                }
            except ImportError:
                stats['quiz'] = {'status': 'not_available'}
            
            # Ajouter stats events si disponible
            try:
                from events.models import Event, InscriptionEvent
                stats['events'] = {
                    'events_total': Event.objects.count(),
                    'events_publies': Event.objects.filter(est_publie=True).count(),
                    'inscriptions_total': InscriptionEvent.objects.count()
                }
            except ImportError:
                stats['events'] = {'status': 'not_available'}
            
            return Response(stats)
            
        except Exception as e:
            return Response({
                'error': 'Erreur lors du calcul des statistiques',
                'detail': str(e)
            }, status=500)


urlpatterns = [
    # Vue racine de l'API
    path('', APIRootView.as_view(), name='api-root'),
    
    # Vérification de santé
    path('health/', APIHealthView.as_view(), name='api-health'),
    
    # Statistiques générales
    path('stats/', APIStatsView.as_view(), name='api-stats'),
]