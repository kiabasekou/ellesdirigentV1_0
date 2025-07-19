"""
Configuration Swagger/OpenAPI pour la documentation automatique de l'API
Génère une documentation interactive et des schémas pour les clients
"""
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Configuration de base de la documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Plateforme Femmes en Politique API",
        default_version='v1',
        description="""
        ## API REST pour la Plateforme Femmes en Politique du Gabon
        
        Cette API permet de gérer:
        - **Authentification**: Inscription, connexion avec JWT
        - **Profils**: Gestion des profils des participantes
        - **Forums**: Discussions et échanges
        - **Événements**: Formations et rencontres
        - **Ressources**: Documents et guides
        - **Réseautage**: Connexions et mentorat
        
        ### Authentification
        
        L'API utilise JWT (JSON Web Tokens) pour l'authentification.
        
        1. Obtenez un token via `/api/token/`
        2. Incluez le token dans l'header: `Authorization: Bearer <token>`
        3. Rafraîchissez le token via `/api/token/refresh/`
        
        ### Limites de taux
        
        - Utilisateurs anonymes: 100 requêtes/heure
        - Utilisateurs authentifiés: 1000 requêtes/heure
        - Endpoints de login: 5 tentatives/minute
        
        ### Codes d'erreur
        
        - `400`: Requête invalide
        - `401`: Non authentifié
        - `403`: Accès refusé
        - `404`: Ressource non trouvée
        - `429`: Limite de taux dépassée
        - `500`: Erreur serveur
        """,
        terms_of_service="https://femmes-politique.ga/terms/",
        contact=openapi.Contact(
            name="Support Technique",
            email="support@femmes-politique.ga"
        ),
        license=openapi.License(
            name="Propriétaire",
            url="https://femmes-politique.ga/license/"
        ),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=(),
)

# Paramètres communs pour la documentation
common_parameters = {
    'page': openapi.Parameter(
        'page',
        openapi.IN_QUERY,
        description="Numéro de page",
        type=openapi.TYPE_INTEGER,
        default=1
    ),
    'page_size': openapi.Parameter(
        'page_size',
        openapi.IN_QUERY,
        description="Nombre d'éléments par page (max: 100)",
        type=openapi.TYPE_INTEGER,
        default=20
    ),
    'search': openapi.Parameter(
        'search',
        openapi.IN_QUERY,
        description="Terme de recherche",
        type=openapi.TYPE_STRING
    ),
    'ordering': openapi.Parameter(
        'ordering',
        openapi.IN_QUERY,
        description="Champ de tri (préfixe '-' pour décroissant)",
        type=openapi.TYPE_STRING
    ),
}

# Schémas de réponse communs
error_response = openapi.Response(
    description="Erreur",
    schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'error': openapi.Schema(type=openapi.TYPE_BOOLEAN, default=True),
            'message': openapi.Schema(type=openapi.TYPE_STRING),
            'details': openapi.Schema(type=openapi.TYPE_OBJECT),
            'code': openapi.Schema(type=openapi.TYPE_STRING),
        }
    )
)

success_response = openapi.Response(
    description="Succès",
    schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'message': openapi.Schema(type=openapi.TYPE_STRING),
            'data': openapi.Schema(type=openapi.TYPE_OBJECT),
        }
    )
)

paginated_response = openapi.Response(
    description="Réponse paginée",
    schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'count': openapi.Schema(type=openapi.TYPE_INTEGER),
            'next': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_URI),
            'previous': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_URI),
            'current_page': openapi.Schema(type=openapi.TYPE_INTEGER),
            'total_pages': openapi.Schema(type=openapi.TYPE_INTEGER),
            'page_size': openapi.Schema(type=openapi.TYPE_INTEGER),
            'results': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_OBJECT)),
        }
    )
)

# Décorateurs pour la documentation des vues
from drf_yasg.utils import swagger_auto_schema
from functools import wraps

def document_api(
    operation_summary=None,
    operation_description=None,
    request_body=None,
    responses=None,
    tags=None,
    manual_parameters=None
):
    """
    Décorateur pour documenter automatiquement les endpoints API
    """
    def decorator(func):
        @wraps(func)
        @swagger_auto_schema(
            operation_summary=operation_summary,
            operation_description=operation_description,
            request_body=request_body,
            responses=responses or {
                200: success_response,
                400: error_response,
                401: error_response,
                403: error_response,
                404: error_response,
            },
            tags=tags,
            manual_parameters=manual_parameters
        )
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Exemples de documentation pour les vues
user_list_docs = document_api(
    operation_summary="Liste des participantes",
    operation_description="""
    Retourne la liste paginée des participantes.
    
    **Permissions**: Authentifié
    
    **Filtres disponibles**:
    - `region`: Filtrer par région
    - `ville`: Filtrer par ville
    - `experience`: Filtrer par niveau d'expérience
    - `is_mentor`: Filtrer les mentors (true/false)
    - `statut_validation`: Filtrer par statut
    
    **Tri disponible**:
    - `date_joined`: Date d'inscription
    - `last_activity`: Dernière activité
    - `first_name`: Prénom
    """,
    tags=['Utilisateurs'],
    manual_parameters=[
        common_parameters['page'],
        common_parameters['page_size'],
        common_parameters['search'],
        common_parameters['ordering'],
        openapi.Parameter(
            'region',
            openapi.IN_QUERY,
            description="Filtrer par région",
            type=openapi.TYPE_STRING,
            enum=['estuaire', 'haut_ogooue', 'moyen_ogooue', 'ngounie', 'nyanga', 'ogooue_ivindo', 'ogooue_lolo', 'ogooue_maritime', 'woleu_ntem']
        ),
    ],
    responses={
        200: paginated_response,
    }
)

register_docs = document_api(
    operation_summary="Inscription d'une nouvelle participante",
    operation_description="""
    Crée un nouveau compte participante.
    
    **Validation**:
    - Email unique et valide
    - Username unique (3-20 caractères)
    - NIP valide (12 caractères alphanumériques)
    - Mot de passe complexe (12+ caractères)
    - Document justificatif requis (PDF, JPG, PNG - Max 5MB)
    
    **Processus**:
    1. Validation des données
    2. Création du compte (statut: en_attente)
    3. Envoi email de bienvenue
    4. Notification aux admins
    """,
    tags=['Authentification'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'nip', 'region', 'ville', 'document_justificatif', 'accept_terms'],
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, min_length=3, max_length=20),
            'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
            'password': openapi.Schema(type=openapi.TYPE_STRING, min_length=12),
            'password_confirm': openapi.Schema(type=openapi.TYPE_STRING),
            'first_name': openapi.Schema(type=openapi.TYPE_STRING),
            'last_name': openapi.Schema(type=openapi.TYPE_STRING),
            'nip': openapi.Schema(type=openapi.TYPE_STRING, pattern='^[A-Z0-9]{12}$'),
            'phone': openapi.Schema(type=openapi.TYPE_STRING),
            'date_of_birth': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
            'region': openapi.Schema(type=openapi.TYPE_STRING),
            'ville': openapi.Schema(type=openapi.TYPE_STRING),
            'experience': openapi.Schema(type=openapi.TYPE_STRING, enum=['aucune', 'locale', 'regionale', 'nationale']),
            'document_justificatif': openapi.Schema(type=openapi.TYPE_FILE),
            'accept_terms': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        }
    ),
    responses={
        201: openapi.Response(
            description="Inscription réussie",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'tokens': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'access': openapi.Schema(type=openapi.TYPE_STRING),
                            'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                        }
                    ),
                    'message': openapi.Schema(type=openapi.TYPE_STRING),
                }
            )
        ),
    }
)