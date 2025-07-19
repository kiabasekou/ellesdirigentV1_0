from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

# Routes API
api_patterns = [
    # Authentification
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.RegistrationView.as_view(), name='register'),
    
    # Profil utilisateur
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('participants/', views.ParticipanteListView.as_view(), name='participants_list'),
]

# Routes Admin (templates HTML)
admin_patterns = [
    path('pending/', views.pending_participants, name='pending_participants'),
    path('dashboard/', views.dashboard_admin, name='dashboard'),
    path('validate/<int:user_id>/', views.validate_participant, name='validate_participant'),
]

urlpatterns = [
    path('api/', include(api_patterns)),
    path('admin/', include(admin_patterns)),
]