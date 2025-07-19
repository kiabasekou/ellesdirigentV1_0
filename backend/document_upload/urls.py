from django.urls import path
from .views import UploadDocumentsView

urlpatterns = [
    path('', UploadDocumentsView.as_view(), name='upload-documents'),
]