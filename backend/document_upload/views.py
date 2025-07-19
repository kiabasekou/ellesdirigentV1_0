from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class UploadDocumentsView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('document_justificatif')

        if not file:
            return Response({'error': 'Aucun fichier reçu.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.document_justificatif = file
        user.save()

        return Response({'success': 'Fichier reçu et enregistré.'}, status=status.HTTP_200_OK)