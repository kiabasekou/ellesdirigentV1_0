from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Participante

# Serializers simples
from rest_framework import serializers

class SimpleRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Participante
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'nip', 'region', 'ville', 'experience', 'document_justificatif']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Participante.objects.create_user(password=password, **validated_data)
        return user

class SimpleParticipanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participante
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nip', 'region', 'ville', 'experience', 'statut_validation']

class SimpleLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

# Vues
class CustomTokenObtainPairView(TokenObtainPairView):
    """Vue de connexion personnalisée"""
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username et password requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({'error': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'error': 'Compte non activé'}, status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': SimpleParticipanteSerializer(user).data
        })

class RegistrationView(APIView):
    """Vue d'inscription"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SimpleRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Inscription réussie. Votre compte sera activé après validation.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """Vue pour consulter le profil"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = SimpleParticipanteSerializer(request.user)
        return Response(serializer.data)

class ParticipanteListView(generics.ListAPIView):
    """Liste des participantes validées"""
    serializer_class = SimpleParticipanteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Participante.objects.filter(statut_validation='validee', is_active=True)

# Vues admin (templates HTML)
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q

@staff_member_required
def pending_participants(request):
    """Interface admin pour gérer les inscriptions en attente"""
    
    # Filtres
    status_filter = request.GET.get('status', 'en_attente')
    region_filter = request.GET.get('region', '')
    search = request.GET.get('search', '')
    
    # Requête de base
    participants = Participante.objects.all()
    
    if status_filter:
        participants = participants.filter(statut_validation=status_filter)
    
    if region_filter:
        participants = participants.filter(region=region_filter)
    
    if search:
        participants = participants.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search) |
            Q(nip__icontains=search)
        )
    
    participants = participants.order_by('-date_joined')
    
    # Pagination
    paginator = Paginator(participants, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistiques
    stats = {
        'total': Participante.objects.count(),
        'en_attente': Participante.objects.filter(statut_validation='en_attente').count(),
        'validee': Participante.objects.filter(statut_validation='validee').count(),
        'rejetee': Participante.objects.filter(statut_validation='rejetee').count(),
    }
    
    # Régions pour le filtre
    regions = Participante.objects.values_list('region', flat=True).distinct()
    
    context = {
        'page_obj': page_obj,
        'stats': stats,
        'regions': regions,
        'current_status': status_filter,
        'current_region': region_filter,
        'current_search': search,
    }
    
    return render(request, 'admin/pending_participants.html', context)

@staff_member_required
def validate_participant(request, user_id):
    """Validation d'une participante"""
    
    user = get_object_or_404(Participante, id=user_id)
    
    if request.method == 'POST':
        action = request.POST.get('action')
        motif_rejet = request.POST.get('motif_rejet', '')
        
        if action == 'valider':
            user.statut_validation = 'validee'
            user.is_active = True
            user.validated_at = timezone.now()
            user.validated_by = request.user
            user.motif_rejet = ''
            user.save()
            
            messages.success(request, f'Inscription de {user.get_full_name()} validée.')
        
        elif action == 'rejeter':
            if not motif_rejet:
                messages.error(request, 'Le motif de rejet est obligatoire.')
                return redirect('users:pending_participants')
            
            user.statut_validation = 'rejetee'
            user.is_active = False
            user.validated_at = timezone.now()
            user.validated_by = request.user
            user.motif_rejet = motif_rejet
            user.save()
            
            messages.success(request, f'Inscription de {user.get_full_name()} rejetée.')
    
    return redirect('users:pending_participants')

@staff_member_required
def dashboard_admin(request):
    """Tableau de bord administrateur"""
    
    # Statistiques générales
    total_users = Participante.objects.count()
    pending_count = Participante.objects.filter(statut_validation='en_attente').count()
    validated_count = Participante.objects.filter(statut_validation='validee').count()
    rejected_count = Participante.objects.filter(statut_validation='rejetee').count()
    
    # Inscriptions récentes
    recent_inscriptions = Participante.objects.filter(
        statut_validation='en_attente'
    ).order_by('-date_joined')[:5]
    
    context = {
        'total_users': total_users,
        'pending_count': pending_count,
        'validated_count': validated_count,
        'rejected_count': rejected_count,
        'recent_inscriptions': recent_inscriptions,
        'validation_rate': round((validated_count / total_users * 100) if total_users > 0 else 0, 1),
    }
    
    return render(request, 'admin/dashboard.html', context)