# backend/training/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Formation, InscriptionFormation
from .serializers import FormationSerializer

class FormationViewSet(viewsets.ModelViewSet):
    queryset = Formation.objects.all()
    serializer_class = FormationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def inscrire(self, request, pk=None):
        formation = self.get_object()
        
        # Vérifier disponibilité
        if formation.participants.count() >= formation.max_participants:
            return Response(
                {'error': 'Formation complète'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer inscription
        inscription, created = InscriptionFormation.objects.get_or_create(
            formation=formation,
            participante=request.user
        )
        
        if created:
            return Response({'message': 'Inscription réussie'})
        else:
            return Response({'message': 'Déjà inscrite'})
    
    @action(detail=False)
    def mes_formations(self, request):
        formations = Formation.objects.filter(
            participants=request.user
        )
        serializer = self.get_serializer(formations, many=True)
        return Response(serializer.data)