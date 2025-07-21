# ============================================================================
# backend/users/views.py - CORRECTION COMPLÈTE
# ============================================================================
"""
Vues pour l'authentification et gestion des utilisateurs - Version complète
CORRECTION: Ajout de toutes les vues manquantes
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone

from .serializers import (
    SimpleRegistrationSerializer, 
    SimpleParticipanteSerializer, 
    SimpleLoginSerializer, 
    ProfileUpdateSerializer, 
    ChangePasswordSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vue de connexion JWT personnalisée"""
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username et password requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Identifiants invalides'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Compte non activé'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': SimpleParticipanteSerializer(user).data
        })


class RegistrationView(APIView):
    """CORRECTION: Vue d'inscription manquante"""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SimpleRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Inscription réussie',
                'user': SimpleParticipanteSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Alias pour compatibilité avec l'ancien nom
RegisterView = RegistrationView


class LoginView(APIView):
    """CORRECTION: Vue de connexion alternative"""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SimpleLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            
            if user and user.is_active:
                refresh = RefreshToken.for_user(user)
                
                # Mettre à jour la dernière connexion
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': SimpleParticipanteSerializer(user).data
                })
            
            return Response(
                {'error': 'Identifiants invalides ou compte inactif'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveAPIView):
    """Vue pour consulter le profil utilisateur"""
    
    serializer_class = SimpleParticipanteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get(self, request, *args, **kwargs):
        """Récupère les informations du profil"""
        serializer = self.get_serializer(request.user)
        
        # Ajouter des statistiques utilisateur
        stats = {
            'date_inscription': request.user.date_joined,
            'derniere_connexion': request.user.last_login,
            'nb_formations': 0,
            'nb_events': 0,
            'nb_quiz': 0
        }
        
        try:
            # Formations
            stats['nb_formations'] = request.user.inscriptions_formations.count()
        except:
            pass
        
        try:
            # Événements
            stats['nb_events'] = request.user.inscriptions_events.count()
        except:
            pass
        
        try:
            # Quiz
            from quiz.models import TentativeQuiz
            stats['nb_quiz'] = TentativeQuiz.objects.filter(participante=request.user).count()
        except:
            pass
        
        return Response({
            'user': serializer.data,
            'statistics': stats
        })


class ProfileUpdateView(generics.UpdateAPIView):
    """Vue pour mettre à jour le profil"""
    
    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def patch(self, request, *args, **kwargs):
        """Mise à jour partielle du profil"""
        response = super().patch(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Retourner le profil complet mis à jour
            updated_user = self.get_object()
            serializer = SimpleParticipanteSerializer(updated_user)
            
            return Response({
                'message': 'Profil mis à jour avec succès',
                'user': serializer.data
            })
        
        return response


class ChangePasswordView(APIView):
    """Vue pour changer le mot de passe"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            # Vérifier l'ancien mot de passe
            if not user.check_password(old_password):
                return Response(
                    {'error': 'Ancien mot de passe incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider le nouveau mot de passe
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                return Response(
                    {'error': list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Changer le mot de passe
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': 'Mot de passe changé avec succès'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Vue pour déconnexion (blacklist du token)"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Déconnexion réussie'
            })
            
        except Exception as e:
            return Response(
                {'error': 'Erreur lors de la déconnexion'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserListView(generics.ListAPIView):
    """Vue pour lister les utilisateurs (admin seulement)"""
    
    serializer_class = SimpleParticipanteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all().order_by('-date_joined')
        else:
            # Utilisateurs non-admin ne voient que leur propre profil
            return User.objects.filter(id=self.request.user.id)


class UserStatsView(APIView):
    """Vue pour les statistiques utilisateur détaillées"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Statistiques de base
        stats = {
            'profil': {
                'nom_complet': user.get_full_name(),
                'email': user.email,
                'date_inscription': user.date_joined,
                'derniere_connexion': user.last_login,
                'est_actif': user.is_active
            },
            'activite': {
                'formations': 0,
                'formations_terminees': 0,
                'events': 0,
                'events_passes': 0,
                'quiz_tentatives': 0,
                'quiz_reussis': 0
            },
            'progression': {
                'formations_en_cours': 0,
                'formations_completees': 0,
                'certifications_obtenues': 0
            }
        }
        
        try:
            # Statistiques formations
            inscriptions_formations = user.inscriptions_formations.all()
            stats['activite']['formations'] = inscriptions_formations.count()
            stats['activite']['formations_terminees'] = inscriptions_formations.filter(
                statut='terminee'
            ).count()
            stats['progression']['formations_en_cours'] = inscriptions_formations.filter(
                statut='en_cours'
            ).count()
            stats['progression']['formations_completees'] = inscriptions_formations.filter(
                statut='terminee'
            ).count()
            
            # Certificats
            stats['progression']['certifications_obtenues'] = inscriptions_formations.filter(
                certificat_genere=True
            ).count()
            
        except Exception:
            pass
        
        try:
            # Statistiques événements
            inscriptions_events = user.inscriptions_events.all()
            stats['activite']['events'] = inscriptions_events.count()
            stats['activite']['events_passes'] = inscriptions_events.filter(
                statut='presente'
            ).count()
            
        except Exception:
            pass
        
        try:
            # Statistiques quiz
            from quiz.models import TentativeQuiz
            tentatives = TentativeQuiz.objects.filter(participante=user)
            stats['activite']['quiz_tentatives'] = tentatives.count()
            stats['activite']['quiz_reussis'] = tentatives.filter(
                score__gte=models.F('quiz__note_passage'),
                date_fin__isnull=False
            ).count()
            
        except Exception:
            pass
        
        return Response(stats)


class ActivateAccountView(APIView):
    """Vue pour activer un compte utilisateur"""
    
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.save()
            
            return Response({
                'message': f'Compte de {user.get_full_name()} activé avec succès'
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )


class DeactivateAccountView(APIView):
    """Vue pour désactiver un compte utilisateur"""
    
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            if user.is_superuser:
                return Response(
                    {'error': 'Impossible de désactiver un superutilisateur'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.is_active = False
            user.save()
            
            return Response({
                'message': f'Compte de {user.get_full_name()} désactivé avec succès'
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )