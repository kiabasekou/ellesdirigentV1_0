
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import Participante
from django.core.exceptions import ObjectDoesNotExist

class VerifyNIPView(APIView):
    def post(self, request):
        nip = request.data.get('nip')
        if not nip:
            return Response({'error': 'NIP requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Participante.objects.get(nip=nip)
            return Response({
                'valid': True,
                'nom': user.last_name,
                'prenom': user.first_name,
                'statut_validation': user.statut_validation
            })
        except ObjectDoesNotExist:
            return Response({'valid': False, 'error': 'NIP non trouvé'}, status=status.HTTP_404_NOT_FOUND)
