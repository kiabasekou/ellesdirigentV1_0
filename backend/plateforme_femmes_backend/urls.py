# ============================================================================
# backend/plateforme_femmes_backend/urls.py - CORRECTION URLS
# ============================================================================
"""
URLs principales du projet - CORRECTION pour éviter les doublons /api/
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
    
    # CORRECTION: Structure d'URLs cohérente
    path('api/', include([
        # Authentification et utilisateurs
        path('auth/', include('users.urls')),
        
        # Modules principaux
        path('training/', include('training.urls')),
        path('quiz/', include('quiz.urls')),
        path('events/', include('events.urls')),
        
        # Upload de documents
        path('upload/', include('document_upload.urls')),
        
        # API générale (stats, health, etc.)
        path('', include('api.urls')),
    ])),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Configuration personnalisée de l'admin
admin.site.site_header = "Administration Elles Dirigent By SO Consulting"
admin.site.site_title = "Plateforme Elles Dirigent Admin"
admin.site.index_title = "Gestion de Elles Dirigent By SO Consulting"