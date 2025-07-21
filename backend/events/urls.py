# ============================================================================
# backend/events/urls.py - CORRECTION
# ============================================================================
"""
URLs pour le module événements - CORRECTION pour éviter /api/api/
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
    # CORRECTION: Supprimer le préfixe 'api/' redondant
    path('', include(router.urls)),
    
    # Vues spécialisées sans préfixe api/
    path('dashboard/', views.EventDashboardView.as_view(), name='dashboard'),
    path('search/', views.EventSearchView.as_view(), name='search'),
    path('recommendations/', views.EventRecommendationView.as_view(), name='recommendations'),
    path('analytics/<uuid:event_id>/', views.EventAnalyticsView.as_view(), name='analytics'),
    path('metrics/<uuid:event_id>/', views.EventMetricsView.as_view(), name='metrics'),
    path('export/<uuid:event_id>/participants/', views.EventExportParticipantsView.as_view(), name='export-participants'),
    path('clone/<uuid:event_id>/', views.EventCloneView.as_view(), name='clone'),
    path('templates/', views.EventTemplatesView.as_view(), name='templates'),
    path('calendar/', views.EventCalendrierView.as_view(), name='calendar'),
]