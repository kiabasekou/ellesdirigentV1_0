from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import Formation, InscriptionFormation, Certificat
from .serializers import (
    FormationListSerializer, FormationDetailSerializer,
    InscriptionFormationSerializer, CertificatSerializer
)
from .utils import generer_certificat

class FormationViewSet(viewsets.ModelViewSet):
    queryset = Formation.objects.filter(status='published')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FormationListSerializer
        return FormationDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtres
        categorie = self.request.query_params.get('categorie')
        niveau = self.request.query_params.get('niveau')
        en_ligne = self.request.query_params.get('en_ligne')
        search = self.request.query_params.get('search')
        
        if categorie:
            queryset = queryset.filter(categorie=categorie)
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        if en_ligne:
            queryset = queryset.filter(est_en_ligne=en_ligne.lower() == 'true')
        if search:
            queryset = queryset.filter(
                Q(titre__icontains=search) | 
                Q(description__icontains=search) |
                Q(formateur__icontains=search)
            )
        
        return queryset.select_related('created_by').prefetch_related('modules')
    
    @action(detail=True, methods=['post'])
    def inscrire(self, request, pk=None):
        formation = self.get_object()
        
        # Vérifications
        if formation.est_complete:
            return Response(
                {'error': 'Formation complète'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if formation.date_debut < timezone.now():
            return Response(
                {'error': 'Formation déjà commencée'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer inscription
        inscription, created = InscriptionFormation.objects.get_or_create(
            formation=formation,
            participante=request.user,
            defaults={'statut': 'inscrite'}
        )
        
        if created:
            return Response({
                'message': 'Inscription réussie',
                'inscription': InscriptionFormationSerializer(inscription).data
            })
        else:
            return Response({
                'message': 'Déjà inscrite',
                'inscription': InscriptionFormationSerializer(inscription).data
            })
    
    @action(detail=True, methods=['post'])
    def desinscrire(self, request, pk=None):
        formation = self.get_object()
        
        try:
            inscription = InscriptionFormation.objects.get(
                formation=formation,
                participante=request.user
            )
            
            if inscription.statut in ['terminee', 'certifiee']:
                return Response(
                    {'error': 'Impossible de se désinscrire d\'une formation terminée'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            inscription.delete()
            return Response({'message': 'Désinscription réussie'})
            
        except InscriptionFormation.DoesNotExist:
            return Response(
                {'error': 'Pas d\'inscription trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False)
    def mes_formations(self, request):
        inscriptions = InscriptionFormation.objects.filter(
            participante=request.user
        ).select_related('formation').order_by('-date_inscription')
        
        serializer = InscriptionFormationSerializer(inscriptions, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def statistiques(self, request):
        if not request.user.is_staff:
            return Response(
                {'error': 'Permissions insuffisantes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = {
            'formations_total': Formation.objects.count(),
            'formations_publiees': Formation.objects.filter(status='published').count(),
            'inscriptions_total': InscriptionFormation.objects.count(),
            'certificats_delivres': Certificat.objects.count(),
            'taux_completion': 0,
            'moyenne_evaluation': 0,
            'categories_populaires': [],
        }
        
        # Taux de completion
        inscriptions_terminees = InscriptionFormation.objects.filter(
            statut__in=['terminee', 'certifiee']
        ).count()
        total_inscriptions = InscriptionFormation.objects.count()
        
        if total_inscriptions > 0:
            stats['taux_completion'] = round(
                (inscriptions_terminees / total_inscriptions) * 100, 2
            )
        
        # Moyenne des évaluations
        moyenne = InscriptionFormation.objects.filter(
            evaluation_formation__isnull=False
        ).aggregate(moyenne=Avg('evaluation_formation'))['moyenne']
        
        if moyenne:
            stats['moyenne_evaluation'] = round(moyenne, 2)
        
        # Catégories populaires
        categories = Formation.objects.values('categorie').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        stats['categories_populaires'] = list(categories)
        
        return Response(stats)

class CertificatViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificatSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Certificat.objects.filter(
            inscription__participante=self.request.user
        ).select_related('inscription__formation')
    
    @action(detail=True, methods=['get'])
    def verifier(self, request, pk=None):
        certificat = self.get_object()
        
        return Response({
            'valide': certificat.est_valide,
            'numero': certificat.numero_certificat,
            'formation': certificat.inscription.formation.titre,
            'participante': certificat.inscription.participante.get_full_name(),
            'date_obtention': certificat.date_generation,
            'hash': certificat.hash_verification
        })