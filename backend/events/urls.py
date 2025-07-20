# ============================================================================
# backend/events/urls.py
# ============================================================================
"""
URLs pour le module événements
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'events'

router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'inscriptions', views.InscriptionEventViewSet, basename='inscription')
router.register(r'rappels', views.RappelEventViewSet, basename='rappel')

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Vues spécialisées
    path('api/dashboard/', views.EventDashboardView.as_view(), name='dashboard'),
    path('api/search/', views.EventSearchView.as_view(), name='search'),
    path('api/recommendations/', views.EventRecommendationView.as_view(), name='recommendations'),
    path('api/analytics/<uuid:event_id>/', views.EventAnalyticsView.as_view(), name='analytics'),
]