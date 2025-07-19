"""
Gestionnaire d'exceptions centralisé pour une gestion cohérente des erreurs
Améliore la sécurité en ne révélant pas d'informations sensibles
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import Http404

logger = logging.getLogger('django.security')


def custom_exception_handler(exc, context):
    """
    Gestionnaire d'exceptions personnalisé qui:
    - Logue toutes les erreurs pour monitoring
    - Retourne des messages d'erreur standardisés
    - Cache les détails techniques en production
    """
    # Appel du gestionnaire par défaut
    response = exception_handler(exc, context)
    
    # Extraction des informations de contexte
    view = context.get('view', None)
    request = context.get('request', None)
    
    # Logging de l'erreur avec contexte
    logger.error(
        f"Exception in {view.__class__.__name__ if view else 'Unknown'}: {exc}",
        exc_info=True,
        extra={
            'request_path': request.path if request else None,
            'request_method': request.method if request else None,
            'user': request.user.username if request and request.user.is_authenticated else 'Anonymous',
        }
    )
    
    if response is not None:
        # Personnalisation des messages d'erreur
        custom_response_data = {
            'error': True,
            'message': 'Une erreur est survenue',
            'details': {}
        }
        
        # Gestion spécifique selon le code d'erreur
        if response.status_code == 400:
            custom_response_data['message'] = 'Requête invalide'
            custom_response_data['details'] = response.data
            
        elif response.status_code == 401:
            custom_response_data['message'] = 'Authentification requise'
            custom_response_data['code'] = 'authentication_failed'
            
        elif response.status_code == 403:
            custom_response_data['message'] = 'Accès refusé'
            custom_response_data['code'] = 'permission_denied'
            
        elif response.status_code == 404:
            custom_response_data['message'] = 'Ressource non trouvée'
            custom_response_data['code'] = 'not_found'
            
        elif response.status_code == 429:
            custom_response_data['message'] = 'Trop de requêtes. Veuillez réessayer plus tard.'
            custom_response_data['code'] = 'rate_limit_exceeded'
            
        elif response.status_code >= 500:
            custom_response_data['message'] = 'Erreur serveur. Nos équipes ont été notifiées.'
            custom_response_data['code'] = 'server_error'
            # En production, ne pas révéler les détails techniques
            if not context.get('request').META.get('DEBUG', False):
                custom_response_data['details'] = {}
        
        response.data = custom_response_data
        
    else:
        # Gestion des exceptions non traitées par DRF
        if isinstance(exc, ValidationError):
            response = Response({
                'error': True,
                'message': 'Erreur de validation',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        elif isinstance(exc, IntegrityError):
            response = Response({
                'error': True,
                'message': 'Contrainte d\'intégrité violée',
                'code': 'integrity_error'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        elif isinstance(exc, Http404):
            response = Response({
                'error': True,
                'message': 'Ressource non trouvée',
                'code': 'not_found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        else:
            # Erreur générique pour toute autre exception
            response = Response({
                'error': True,
                'message': 'Une erreur inattendue s\'est produite',
                'code': 'unexpected_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response


class APIException(Exception):
    """Exception de base pour l'API"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Une erreur serveur s\'est produite.'
    default_code = 'error'
    
    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = detail
        else:
            self.detail = self.default_detail
            
        if code is not None:
            self.code = code
        else:
            self.code = self.default_code


class ValidationException(APIException):
    """Exception pour les erreurs de validation"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Données invalides.'
    default_code = 'invalid'


class AuthenticationException(APIException):
    """Exception pour les erreurs d'authentification"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentification échouée.'
    default_code = 'authentication_failed'


class PermissionException(APIException):
    """Exception pour les erreurs de permission"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Vous n\'avez pas la permission d\'effectuer cette action.'
    default_code = 'permission_denied'


class NotFoundException(APIException):
    """Exception pour les ressources non trouvées"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Ressource non trouvée.'
    default_code = 'not_found'


class RateLimitException(APIException):
    """Exception pour les limites de taux dépassées"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Limite de requêtes dépassée. Veuillez réessayer plus tard.'
    default_code = 'rate_limit_exceeded'