# ============================================================================
# backend/users/serializers.py - CRÉATION MANQUANTE
# ============================================================================
"""
Serializers pour le module utilisateurs
CORRECTION: Création des serializers manquants
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class SimpleParticipanteSerializer(serializers.ModelSerializer):
    """Serializer simple pour les informations utilisateur"""
    
    nom_complet = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nom_complet', 'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'nom_complet'
        ]


class SimpleRegistrationSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription d'un nouvel utilisateur"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm'
        ]
    
    def validate(self, data):
        """Validation personnalisée"""
        # Vérifier que les mots de passe correspondent
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError(
                "Les mots de passe ne correspondent pas"
            )
        
        # Valider le mot de passe avec les règles Django
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        
        return data
    
    def validate_email(self, value):
        """Vérifier l'unicité de l'email"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Un utilisateur avec cet email existe déjà"
            )
        return value
    
    def validate_username(self, value):
        """Vérifier l'unicité du nom d'utilisateur"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà pris"
            )
        return value
    
    def create(self, validated_data):
        """Créer un nouvel utilisateur"""
        # Retirer password_confirm
        validated_data.pop('password_confirm', None)
        
        # Extraire le mot de passe
        password = validated_data.pop('password')
        
        # Créer l'utilisateur
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user


class SimpleLoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validation des identifiants"""
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            raise serializers.ValidationError(
                "Nom d'utilisateur et mot de passe requis"
            )
        
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email'
        ]
    
    def validate_email(self, value):
        """Vérifier l'unicité de l'email (sauf pour l'utilisateur actuel)"""
        user = self.instance
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError(
                "Un utilisateur avec cet email existe déjà"
            )
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour changer le mot de passe"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validation des mots de passe"""
        new_password = data['new_password']
        new_password_confirm = data['new_password_confirm']
        
        if new_password != new_password_confirm:
            raise serializers.ValidationError(
                "Les nouveaux mots de passe ne correspondent pas"
            )
        
        # Valider le nouveau mot de passe
        try:
            validate_password(new_password)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        
        return data


class UserDetailSerializer(SimpleParticipanteSerializer):
    """Serializer détaillé pour les utilisateurs (admin)"""
    
    # Statistiques calculées
    nb_formations = serializers.SerializerMethodField()
    nb_events = serializers.SerializerMethodField()
    nb_quiz = serializers.SerializerMethodField()
    
    class Meta(SimpleParticipanteSerializer.Meta):
        fields = SimpleParticipanteSerializer.Meta.fields + [
            'is_staff', 'is_superuser', 'nb_formations', 'nb_events', 'nb_quiz'
        ]
    
    def get_nb_formations(self, obj):
        """Nombre de formations de l'utilisateur"""
        try:
            return obj.inscriptions_formations.count()
        except:
            return 0
    
    def get_nb_events(self, obj):
        """Nombre d'événements de l'utilisateur"""
        try:
            return obj.inscriptions_events.count()
        except:
            return 0
    
    def get_nb_quiz(self, obj):
        """Nombre de tentatives de quiz"""
        try:
            from quiz.models import TentativeQuiz
            return TentativeQuiz.objects.filter(participante=obj).count()
        except:
            return 0


class UserStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques utilisateur"""
    
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    users_with_formations = serializers.IntegerField()
    users_with_events = serializers.IntegerField()


class UserActivationSerializer(serializers.Serializer):
    """Serializer pour l'activation/désactivation d'utilisateurs"""
    
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    action = serializers.ChoiceField(choices=['activate', 'deactivate'])
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)


class UserSearchSerializer(serializers.Serializer):
    """Serializer pour la recherche d'utilisateurs"""
    
    query = serializers.CharField(max_length=100)
    filters = serializers.DictField(required=False)
    
    def validate_query(self, value):
        """Valider la requête de recherche"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "La recherche doit contenir au moins 2 caractères"
            )
        return value.strip()


class PasswordResetSerializer(serializers.Serializer):
    """Serializer pour la réinitialisation de mot de passe"""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Vérifier que l'email existe"""
        try:
            User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Aucun compte actif trouvé avec cet email"
            )
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer pour confirmer la réinitialisation de mot de passe"""
    
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validation des mots de passe"""
        new_password = data['new_password']
        new_password_confirm = data['new_password_confirm']
        
        if new_password != new_password_confirm:
            raise serializers.ValidationError(
                "Les mots de passe ne correspondent pas"
            )
        
        # Valider le mot de passe
        try:
            validate_password(new_password)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        
        return data


class BulkUserActionSerializer(serializers.Serializer):
    """Serializer pour les actions en lot sur les utilisateurs"""
    
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100
    )
    action = serializers.ChoiceField(choices=[
        ('activate', 'Activer'),
        ('deactivate', 'Désactiver'),
        ('delete', 'Supprimer'),
        ('export', 'Exporter')
    ])
    confirm = serializers.BooleanField(default=False)
    
    def validate(self, data):
        """Validation des actions en lot"""
        if data['action'] in ['deactivate', 'delete'] and not data['confirm']:
            raise serializers.ValidationError(
                "Confirmation requise pour cette action"
            )
        
        return data