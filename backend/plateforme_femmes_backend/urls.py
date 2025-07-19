from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from users.admin_views import pending_participants, validate_participant, reject_participant

# Vue simple pour le health check
def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'API Plateforme Femmes en Politique',
        'version': '1.0.0'
    })

def api_root(request):
    return JsonResponse({
        'message': 'API Plateforme Femmes en Politique',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'register': '/api/register/',
                'login': '/api/token/',
                'refresh': '/api/token/refresh/',
            },
            'users': {
                'profile': '/api/profile/',
                'users': '/api/users/',
                'me': '/api/users/me/',
                'statistics': '/api/users/statistics/',
            }
        }
    })

urlpatterns = [
    # Administration Django
    path('admin/', admin.site.urls),

    # Vues personnalisées d'administration
    path("admin/participants/pending/", pending_participants, name="pending_participants"),
    path("admin/participants/validate/<int:pk>/", validate_participant, name="validate_participant"),
    path("admin/participants/reject/<int:pk>/", reject_participant, name="reject_participant"),

    # API endpoints
    path('api/', api_root, name='api_root'),
    path('api/health/', health_check, name='health_check'),
    
    # Routes utilisateurs (auth, profils, etc.)
    path('api/', include('users.urls')),
    
    # SUPPRIMEZ ou COMMENTEZ cette ligne qui cause l'erreur :
    # path('users/', include('users.api_urls')),  # CETTE LIGNE CAUSE L'ERREUR
    
    # Routes futures (commentées pour l'instant)
    # path('api/verify-nip/', include('nip_verification.urls')),
    # path('api/upload-documents/', include('document_upload.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)