
from django.urls import path
from users.views import RegisterView, LoginView, ProfileView

app_name = 'api'
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
