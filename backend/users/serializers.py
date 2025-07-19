"""
Serializers optimisés avec corrections des erreurs de champs
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.core.cache import cache
from django.utils.translation import gettext_lazy as _
from .models import Participante, UserProfile
from PIL import Image
import io


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """Serializer de base permettant de spécifier les champs à inclure/exclure"""
    
    def __init__(self, *args, **kwargs):
        # Extraction des paramètres de champs
        fields = kwargs.pop('fields', None)
        exclude = kwargs.pop('exclude', None)
        
        super().__init__(*args, **kwargs)
        
        if fields is not None:
            # Garde uniquement les champs spécifiés
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
                
        if exclude is not None:
            # Supprime les champs exclus
            for field_name in exclude:
                self.fields.pop(field_name, None)


class UserProfileSerializer(DynamicFieldsModelSerializer):
    """Serializer pour le profil étendu avec validation"""
    
    completion_percentage = serializers.ReadOnlyField()
    skills_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'education_level', 'skills', 'languages',
            'political_interests', 'career_goals', 'current_position',
            'organization', 'mentorship_areas', 'website', 'linkedin',
            'twitter', 'completion_percentage', 'is_public',
            'show_contact_info', 'skills_count'
        ]
        
    def get_skills_count(self, obj):
        """Retourne le nombre de compétences"""
        return len(obj.skills) if obj.skills else 0
    
    def validate_skills(self, value):
        """Valide et nettoie la liste des compétences"""
        if not isinstance(value, list):
            raise serializers.ValidationError(_("Les compétences doivent être une liste."))
        
        # Nettoyer et valider chaque compétence
        cleaned_skills = []
        for skill in value:
            if isinstance(skill, str) and skill.strip():
                cleaned_skill = skill.strip()[:50]  # Limite à 50 caractères
                if cleaned_skill not in cleaned_skills:
                    cleaned_skills.append(cleaned_skill)
                    
        return cleaned_skills[:20]  # Maximum 20 compétences


class ParticipanteSerializer(DynamicFieldsModelSerializer):
    """Serializer principal pour les participantes avec optimisations"""
    
    nom_complet = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    stats = serializers.SerializerMethodField()
    profile = UserProfileSerializer(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = Participante
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nom_complet', 'nip', 'phone', 'date_of_birth', 'age',
            'region', 'ville', 'experience', 'avatar', 'avatar_url',
            'statut_validation', 'motif_rejet', 'date_joined',
            'last_activity', 'is_mentor', 'email_notifications',
            'stats', 'profile', 'is_online'
        ]
        read_only_fields = [
            'id', 'statut_validation', 'motif_rejet', 'date_joined',
            'validated_at', 'stats', 'is_online'
        ]
        extra_kwargs = {
            'nip': {'write_only': True},  # NIP jamais exposé en lecture
            'email': {'required': True},
            'phone': {'required': False},
        }
    
    def get_stats(self, obj):
        """Retourne des statistiques simplifiées"""
        return {
            'forums_count': 0,  # Placeholder
            'events_count': 0,  # Placeholder
            'resources_count': 0,  # Placeholder
            'connections_count': 0,  # Placeholder
            'mentees_count': 0 if not obj.is_mentor else 0,  # Placeholder
        }
    
    def get_avatar_url(self, obj):
        """Retourne l'URL de l'avatar optimisé"""
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None
    
    def get_is_online(self, obj):
        """Vérifie si l'utilisateur est en ligne (cache Redis)"""
        cache_key = f'user_online_{obj.id}'
        return cache.get(cache_key, False)
    
    def to_representation(self, instance):
        """Personnalise la représentation selon le contexte"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Masquer les informations sensibles selon les permissions
        if request and request.user != instance and hasattr(instance, 'profile'):
            if not instance.profile.show_contact_info:
                data.pop('email', None)
                data.pop('phone', None)
                
            if not instance.profile.is_public and not request.user.is_staff:
                # Retourner uniquement les informations de base
                allowed_fields = ['id', 'nom_complet', 'region', 'avatar_url']
                return {k: v for k, v in data.items() if k in allowed_fields}
                
        return data


class RegistrationSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription avec validation complète"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text=_("Minimum 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux")
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    document_justificatif = serializers.FileField(
        required=True,
        help_text=_("Document attestant de votre NIP (PDF, JPG, PNG - Max 5MB)")
    )
    accept_terms = serializers.BooleanField(
        write_only=True,  # IMPORTANT: write_only=True
        required=True,
        error_messages={
            'required': _("Vous devez accepter les conditions d'utilisation.")
        }
    )
    
    class Meta:
        model = Participante
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'nip', 'phone', 'date_of_birth',
            'region', 'ville', 'experience', 'document_justificatif',
            'accept_terms'  # Inclure mais sera supprimé dans validate()
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'nip': {'required': True},
            'region': {'required': True},
            'ville': {'required': True},
        }

    
    def validate_email(self, value):
        """Vérifie l'unicité de l'email"""
        if Participante.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                _("Un compte avec cette adresse email existe déjà.")
            )
        return value.lower()
    
    def validate_username(self, value):
        """Vérifie l'unicité du nom d'utilisateur"""
        if Participante.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                _("Ce nom d'utilisateur est déjà pris.")
            )
        return value.lower()
    
    def validate_nip(self, value):
        """Valide le format du NIP"""
        if len(value) < 8:
            raise serializers.ValidationError(
                _("Le NIP doit contenir au moins 8 caractères.")
            )
        
        if not value.isalnum():
            raise serializers.ValidationError(
                _("Le NIP ne doit contenir que des lettres et des chiffres.")
            )
            
        if Participante.objects.filter(nip=value).exists():
            raise serializers.ValidationError(
                _("Ce NIP est déjà enregistré.")
            )
            
        return value.upper()
    
    def validate_document_justificatif(self, value):
        """Valide le document uploadé"""
        # Vérifier la taille
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError(
                _("La taille du fichier ne doit pas dépasser 5MB.")
            )
        
        # Vérifier le type MIME
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                _("Format de fichier non supporté. Utilisez PDF, JPG ou PNG.")
            )
        
        # Vérifier l'extension
        ext = value.name.split('.')[-1].lower()
        if ext not in ['pdf', 'jpg', 'jpeg', 'png']:
            raise serializers.ValidationError(
                _("Extension de fichier non valide.")
            )
            
        # Pour les images, vérifier qu'elles sont valides
        if value.content_type.startswith('image/'):
            try:
                img = Image.open(value)
                img.verify()
            except:
                raise serializers.ValidationError(
                    _("Fichier image corrompu ou invalide.")
                )
                
        return value
    
    def validate_password(self, value):
        """Valide la complexité du mot de passe"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Validation globale"""
        # Vérifier la correspondance des mots de passe
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': _("Les mots de passe ne correspondent pas.")
            })
        
        # Supprimer les champs non nécessaires pour la création
        attrs.pop('password_confirm', None)
        attrs.pop('accept_terms', None)
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Crée l'utilisateur et son profil dans une transaction"""
        # Extraire le fichier
        document = validated_data.pop('document_justificatif')
        
        # Créer l'utilisateur
        user = Participante.objects.create_user(**validated_data)
        user.document_justificatif = document
        user.save()
        
        # Le profil sera créé automatiquement par les signaux
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion avec validation"""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Valide les credentials"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Permettre la connexion avec email ou username
        user = None
        if '@' in username:
            try:
                user_obj = Participante.objects.get(email__iexact=username)
                user = authenticate(
                    request=self.context.get('request'),
                    username=user_obj.username,
                    password=password
                )
            except Participante.DoesNotExist:
                pass
        else:
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )
        
        if not user:
            raise serializers.ValidationError(
                _("Identifiants invalides.")
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                _("Ce compte a été désactivé.")
            )
        
        attrs['user'] = user
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer JWT personnalisé avec informations supplémentaires"""
    
    username_field = 'username'
    
    def validate(self, attrs):
        # Utilise le LoginSerializer pour la validation
        login_serializer = LoginSerializer(
            data=attrs,
            context=self.context
        )
        login_serializer.is_valid(raise_exception=True)
        
        # Récupère l'utilisateur validé
        user = login_serializer.validated_data['user']
        
        # Génère les tokens
        data = super().validate({'username': user.username, 'password': attrs['password']})
        
        # Ajoute les informations utilisateur au token
        data['user'] = {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'statut_validation': user.statut_validation,
            'is_mentor': user.is_mentor,
            'region': user.region,
            'avatar_url': None  # Sera défini plus tard si nécessaire
        }
        
        # Met à jour la dernière connexion
        user.update_last_activity()
        
        # Met l'utilisateur en ligne dans le cache
        cache.set(f'user_online_{user.id}', True, 300)  # 5 minutes
        
        return data
    
    @classmethod
    def get_token(cls, user):
        """Personnalise le contenu du token JWT"""
        token = super().get_token(user)
        
        # Ajoute des claims personnalisés
        token['username'] = user.username
        token['email'] = user.email
        token['statut_validation'] = user.statut_validation
        token['is_mentor'] = user.is_mentor
        token['nip'] = user.nip[:4] + '****' + user.nip[-4:] if len(user.nip) >= 8 else '****'
        token['region'] = user.region
        token['ville'] = user.ville
        
        return token


class ParticipanteUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil avec validation"""
    
    profile = UserProfileSerializer(required=False)
    current_password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = Participante
        fields = [
            'first_name', 'last_name', 'phone', 'date_of_birth',
            'ville', 'avatar', 'email_notifications', 'is_mentor',
            'profile', 'current_password', 'new_password'
        ]
        read_only_fields = ['email', 'username', 'nip', 'region']
    
    def validate_avatar(self, value):
        """Valide et optimise l'image de profil"""
        if value:
            # Vérifier la taille
            if value.size > 2 * 1024 * 1024:  # 2MB
                raise serializers.ValidationError(
                    _("L'image ne doit pas dépasser 2MB.")
                )
            
            # Vérifier et optimiser l'image
            try:
                img = Image.open(value)
                img.verify()
                
                # Redimensionner si trop grande
                img = Image.open(value)
                if img.width > 800 or img.height > 800:
                    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                    
                    # Sauvegarder l'image optimisée
                    output = io.BytesIO()
                    img.save(output, format='JPEG', quality=85, optimize=True)
                    output.seek(0)
                    value.file = output
                    
            except:
                raise serializers.ValidationError(
                    _("Fichier image invalide.")
                )
                
        return value
    
    def validate(self, attrs):
        """Validation pour le changement de mot de passe"""
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        
        if new_password and not current_password:
            raise serializers.ValidationError({
                'current_password': _("Le mot de passe actuel est requis pour changer le mot de passe.")
            })
        
        if current_password:
            user = self.instance
            if not user.check_password(current_password):
                raise serializers.ValidationError({
                    'current_password': _("Mot de passe actuel incorrect.")
                })
            
            if new_password:
                try:
                    validate_password(new_password, user)
                except ValidationError as e:
                    raise serializers.ValidationError({
                        'new_password': e.messages
                    })
        
        return attrs
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Met à jour l'utilisateur et son profil"""
        profile_data = validated_data.pop('profile', None)
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('current_password', None)
        
        # Mettre à jour l'utilisateur
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if new_password:
            instance.set_password(new_password)
            
        instance.save()
        
        # Mettre à jour le profil si fourni
        if profile_data and hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        # Invalider le cache
        cache.delete(f'participant_{instance.id}_stats')
        
        return instance


class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer pour les profils publics - Expose uniquement les informations publiques"""
    
    nom_complet = serializers.ReadOnlyField()
    avatar_url = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    mutual_connections = serializers.SerializerMethodField()
    
    class Meta:
        model = Participante
        fields = [
            'id', 'nom_complet', 'region', 'ville', 'experience',
            'avatar_url', 'is_mentor', 'date_joined', 'last_activity',
            'profile', 'is_online', 'mutual_connections'
        ]
    
    def get_avatar_url(self, obj):
        """Retourne l'URL de l'avatar"""
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None
    
    def get_profile(self, obj):
        """Retourne uniquement les informations publiques du profil"""
        if not hasattr(obj, 'profile') or not obj.profile.is_public:
            return None
            
        profile = obj.profile
        data = {
            'bio': profile.bio,
            'current_position': profile.current_position,
            'organization': profile.organization,
            'skills': profile.skills[:5] if profile.skills else [],  # Limite à 5 compétences
            'completion_percentage': profile.completion_percentage
        }
        
        # Ajouter les domaines de mentorat si mentor
        if obj.is_mentor and profile.mentorship_areas:
            data['mentorship_areas'] = profile.mentorship_areas[:3]
            
        return data
    
    def get_is_online(self, obj):
        """Vérifie si l'utilisateur est en ligne"""
        cache_key = f'user_online_{obj.id}'
        return cache.get(cache_key, False)
    
    def get_mutual_connections(self, obj):
        """Compte les connexions mutuelles avec l'utilisateur actuel"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            # Logique pour compter les connexions mutuelles
            # À implémenter avec le modèle de connexions
            return 0
        return None