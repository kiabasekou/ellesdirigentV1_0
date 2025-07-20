# ============================================================================
# backend/training/urls.py (NOUVEAU - manquant)
# ============================================================================
"""
URLs pour l'app training
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'training'

router = DefaultRouter()
router.register(r'formations', views.FormationViewSet, basename='formation')
router.register(r'inscriptions', views.InscriptionFormationViewSet, basename='inscription')

urlpatterns = [
    path('', include(router.urls)),
]