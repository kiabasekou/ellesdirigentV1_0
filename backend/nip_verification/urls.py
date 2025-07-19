
from django.urls import path
from .views import VerifyNIPView

urlpatterns = [
    path('', VerifyNIPView.as_view(), name='verify-nip'),
]
