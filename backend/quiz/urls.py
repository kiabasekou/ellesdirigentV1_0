"""
URLs pour l'app quiz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'quiz'

router = DefaultRouter()
router.register(r'quiz', views.QuizViewSet, basename='quiz')
router.register(r'tentatives', views.TentativeQuizViewSet, basename='tentative')

urlpatterns = [
    path('', include(router.urls)),
]
