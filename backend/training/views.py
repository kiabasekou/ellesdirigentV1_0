# training/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Formation, InscriptionFormation, Certificat, ModuleFormation
from .serializers import (
    FormationSerializer, 
    InscriptionFormationSerializer, 
    CertificatSerializer,
    ModuleFormationSerializer,
    FormationDetailSerializer
)


class FormationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des formations."""
    serializer_class = FormationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne les formations actives et disponibles."""
        queryset = Formation.objects.filter(
            status='active'
        ).select_related('created_by').prefetch_related('modules')
        
        # Filtres par paramètres de requête
        categorie = self.request.query_params.get('categorie')
        niveau = self.request.query_params.get('niveau')
        en_ligne = self.request.query_params.get('en_ligne')
        
        if categorie:
            queryset = queryset.filter(categorie=categorie)
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        if en_ligne is not None:
            queryset = queryset.filter(est_en_ligne=en_ligne.lower() == 'true')
            
        return queryset.order_by('-date_creation')
    
    def get_serializer_class(self):
        """Utilise un serializer détaillé pour les vues de détail."""
        if self.action == 'retrieve':
            return FormationDetailSerializer
        return FormationSerializer
    
    @action(detail=True, methods=['post'])
    def inscrire(self, request, pk=None):
        """Permet à un utilisateur de s'inscrire à une formation."""
        formation = self.get_object()
        
        # Vérifications préalables
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
        
        # Créer ou récupérer l'inscription
        inscription, created = InscriptionFormation.objects.get_or_create(
            formation=formation,
            participante=request.user,
            defaults={'statut': 'inscrite'}
        )
        
        if created:
            return Response({
                'message': 'Inscription réussie',
                'inscription': InscriptionFormationSerializer(inscription).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Déjà inscrite à cette formation',
                'inscription': InscriptionFormationSerializer(inscription).data
            }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def desinscrire(self, request, pk=None):
        """Permet à un utilisateur de se désinscrire d'une formation."""
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
                {'error': 'Aucune inscription trouvée'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def mes_formations(self, request):
        """Retourne les formations auxquelles l'utilisateur est inscrit."""
        inscriptions = InscriptionFormation.objects.filter(
            participante=request.user
        ).select_related('formation')
        
        formations_data = []
        for inscription in inscriptions:
            formation_data = FormationSerializer(inscription.formation).data
            formation_data['inscription'] = {
                'statut': inscription.statut,
                'progression': inscription.progression,
                'date_inscription': inscription.date_inscription,
                'date_completion': inscription.date_completion
            }
            formations_data.append(formation_data)
        
        return Response(formations_data)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Retourne les statistiques générales des formations."""
        stats = {
            'total_formations': Formation.objects.filter(status='active').count(),
            'formations_en_ligne': Formation.objects.filter(
                status='active', est_en_ligne=True
            ).count(),
            'total_participants': InscriptionFormation.objects.count(),
            'taux_completion': 0,
            'moyenne_evaluation': 0,
            'categories_populaires': []
        }
        
        # Calcul du taux de completion
        inscriptions_terminees = InscriptionFormation.objects.filter(
            statut='terminee'
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


class InscriptionFormationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des inscriptions aux formations."""
    serializer_class = InscriptionFormationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne les inscriptions de l'utilisateur connecté."""
        return InscriptionFormation.objects.filter(
            participante=self.request.user
        ).select_related('formation').order_by('-date_inscription')
    
    def perform_create(self, serializer):
        """Associe automatiquement l'utilisateur connecté à l'inscription."""
        serializer.save(participante=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marquer_complete(self, request, pk=None):
        """Marque une inscription comme complétée."""
        inscription = self.get_object()
        
        if inscription.statut == 'terminee':
            return Response({
                'message': 'Formation déjà marquée comme terminée'
            })
        
        # Vérifier que tous les modules sont complétés
        modules_count = inscription.formation.modules.count()
        if modules_count > 0 and inscription.progression < 100:
            return Response(
                {'error': 'Tous les modules doivent être complétés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inscription.statut = 'terminee'
        inscription.date_completion = timezone.now()
        inscription.progression = 100
        inscription.save()
        
        # Générer un certificat si requis
        if inscription.formation.certificat_delivre:
            certificat, created = Certificat.objects.get_or_create(
                inscription=inscription,
                defaults={
                    'date_generation': timezone.now(),
                    'est_valide': True
                }
            )
            if created:
                certificat.generer_numero()
                certificat.generer_hash()
        
        return Response({
            'message': 'Formation marquée comme terminée',
            'inscription': InscriptionFormationSerializer(inscription).data
        })
    
    @action(detail=True, methods=['post'])
    def evaluer(self, request, pk=None):
        """Permet d'évaluer une formation terminée."""
        inscription = self.get_object()
        
        if inscription.statut != 'terminee':
            return Response(
                {'error': 'La formation doit être terminée pour être évaluée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        note = request.data.get('evaluation_formation')
        commentaire = request.data.get('commentaire_evaluation', '')
        
        if not note or not (1 <= note <= 5):
            return Response(
                {'error': 'Note requise (1-5)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inscription.evaluation_formation = note
        inscription.commentaire_evaluation = commentaire
        inscription.save()
        
        return Response({
            'message': 'Évaluation enregistrée',
            'inscription': InscriptionFormationSerializer(inscription).data
        })


class ModuleFormationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des modules de formation."""
    serializer_class = ModuleFormationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        formation_id = self.kwargs.get('formation_pk')
        if formation_id:
            return ModuleFormation.objects.filter(
                formation_id=formation_id
            ).order_by('ordre')
        return ModuleFormation.objects.none()
    
    def perform_create(self, serializer):
        """Associe automatiquement la formation au module."""
        formation_id = self.kwargs.get('formation_pk')
        formation = get_object_or_404(Formation, pk=formation_id)
        serializer.save(formation=formation)
    
    @action(detail=True, methods=['post'])
    def marquer_complete(self, request, **kwargs):
        """Marque un module comme complété pour l'utilisateur."""
        module = self.get_object()
        formation_id = kwargs.get('formation_pk')
        
        # Récupérer l'inscription
        try:
            inscription = InscriptionFormation.objects.get(
                formation_id=formation_id,
                participante=request.user
            )
        except InscriptionFormation.DoesNotExist:
            return Response(
                {'error': 'Inscription non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Ajouter le module aux modules complétés
        if module not in inscription.modules_completes.all():
            inscription.modules_completes.add(module)
            
            # Mettre à jour la progression
            total_modules = inscription.formation.modules.count()
            modules_completes = inscription.modules_completes.count()
            
            if total_modules > 0:
                inscription.progression = (modules_completes / total_modules) * 100
                inscription.save()
        
        return Response({
            'message': 'Module marqué comme complété',
            'progression': inscription.progression
        })


class CertificatViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la consultation des certificats."""
    serializer_class = CertificatSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Certificat.objects.filter(
            inscription__participante=self.request.user
        ).select_related('inscription__formation')
    
    @action(detail=True, methods=['get'])
    def verifier(self, request, pk=None):
        """Vérifie la validité d'un certificat."""
        certificat = self.get_object()
        
        return Response({
            'valide': certificat.est_valide,
            'numero': certificat.numero_certificat,
            'formation': certificat.inscription.formation.titre,
            'participante': certificat.inscription.participante.get_full_name(),
            'date_obtention': certificat.date_generation,
            'hash': certificat.hash_verification
        })
    
    @action(detail=True, methods=['get'])
    def telecharger(self, request, pk=None):
        """Génère et retourne le PDF du certificat."""
        certificat = self.get_object()
        
        # Ici, vous pourriez intégrer une génération PDF
        # Par exemple avec reportlab ou weasyprint
        
        return Response({
            'message': 'Génération de PDF à implémenter',
            'certificat_id': certificat.id
        })