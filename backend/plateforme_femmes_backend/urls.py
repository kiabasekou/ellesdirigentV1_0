
# ============================================================================
# backend/plateforme_femmes_backend/urls.py (CORRECTION et ajout routes)
# ============================================================================
"""
URLs principales du projet - CORRECTION avec toutes les apps
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API des utilisateurs
    path('api/auth/', include('users.urls')),
    
    # API des formations - CORRECTION: ajout
    path('api/training/', include('training.urls')),
    
    # API des quiz - CORRECTION: ajout  
    path('api/quiz/', include('quiz.urls')),
    
    # API des événements - NOUVEAU
    path('api/', include('events.urls')),
    
    # API générale (fallback)
    path('api/', include('api.urls')),
]

# Servir les fichiers média en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

