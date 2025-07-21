# ============================================================================
# backend/plateforme_femmes_backend/urls.py - CORRECTION COMPLÈTE
# ============================================================================
"""
Configuration principale des URLs - Version corrigée
Résout les erreurs d'imports et structure cohérente
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Configuration Swagger/OpenAPI
schema_view = get_schema_view(
    openapi.Info(
        title="Plateforme Femmes en Politique API",
        default_version='v1',
        description="API pour la plateforme de formation et d'accompagnement des femmes en politique",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@plateforme-femmes.org"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Administration Django
    path('admin/', admin.site.urls),
    
    # Documentation API
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # APIs des modules
    path('api/auth/', include('users.urls')),           # Authentification et utilisateurs
    path('api/training/', include('training.urls')),    # CORRECTION: URLs training corrigées
    path('api/quiz/', include('quiz.urls')),             # Quiz et évaluations
    path('api/events/', include('events.urls')),         # NOUVEAU: Module événements
    path('api/upload/', include('document_upload.urls')), # Upload de documents
    
    # API racine (informations générales)
    path('api/', include('api.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Configuration personnalisée de l'admin
admin.site.site_header = "Administration Plateforme Femmes"
admin.site.site_title = "Plateforme Femmes Admin"
admin.site.index_title = "Gestion de la plateforme"