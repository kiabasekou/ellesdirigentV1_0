from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormationViewSet, CertificatViewSet

router = DefaultRouter()
router.register(r'formations', FormationViewSet)
router.register(r'certificats', CertificatViewSet, basename='certificat')

urlpatterns = [
    path('', include(router.urls)),
]