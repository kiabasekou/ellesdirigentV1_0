import django_filters
from django.db.models import Q
from django.core.cache import cache
from .models import Participante, UserProfile 

class ParticipanteFilter(django_filters.FilterSet):
    """
    Filtres pour le modèle Participante.
    Permet de filtrer les participantes par divers critères.
    """
    search = django_filters.CharFilter(method='filter_search', label="Recherche")
    is_mentor = django_filters.BooleanFilter(field_name='is_mentor', label="Est mentor")
    statut_validation = django_filters.ChoiceFilter(
        choices=Participante.STATUS_CHOICES,
        field_name='statut_validation',
        label="Statut de validation"
    )
    is_online = django_filters.BooleanFilter(method='filter_is_online', label="Est en ligne")
    region = django_filters.CharFilter(field_name='region', lookup_expr='icontains', label="Région")
    experience = django_filters.ChoiceFilter(
        choices=Participante.EXPERIENCE_CHOICES,
        field_name='experience',
        label="Niveau d'expérience"
    )

    has_profile_picture = django_filters.BooleanFilter(method='filter_has_profile_picture', label="A une photo de profil")
    min_completion_percentage = django_filters.NumberFilter(
        field_name='profile__completion_percentage',
        lookup_expr='gte',
        label="Pourcentage de complétion min"
    )
    max_completion_percentage = django_filters.NumberFilter(
        field_name='profile__completion_percentage',
        lookup_expr='lte',
        label="Pourcentage de complétion max"
    )

    class Meta:
        model = Participante
        fields = [
            'search', 'is_mentor', 'statut_validation', 'is_online', 'region',
            'experience', 'has_profile_picture',
            'min_completion_percentage', 'max_completion_percentage'
        ]

    def filter_search(self, queryset, name, value):
        """
        Effectue une recherche globale sur plusieurs champs de Participante et UserProfile.
        """
        if not value:
            return queryset
            
        q_objects = Q(email__icontains=value) | \
                    Q(first_name__icontains=value) | \
                    Q(last_name__icontains=value) | \
                    Q(region__icontains=value) | \
                    Q(ville__icontains=value)

        # Recherche dans le profil si il existe
        try:
            q_objects |= Q(profile__bio__icontains=value) | \
                         Q(profile__current_position__icontains=value) | \
                         Q(profile__organization__icontains=value)

            # Recherche dans les champs JSON s'ils existent
            if value:
                q_objects |= Q(profile__skills__contains=[value]) | \
                             Q(profile__languages__contains=[value]) | \
                             Q(profile__political_interests__contains=[value]) | \
                             Q(profile__mentorship_areas__contains=[value])
        except:
            # Si le profil n'existe pas ou si les champs JSON ne sont pas supportés
            pass
        
        return queryset.filter(q_objects).distinct()

    def filter_is_online(self, queryset, name, value):
        """
        Filtre les utilisateurs en ligne (basé sur le cache de session).
        """
        online_users_ids = []
        
        # Récupérer les IDs des utilisateurs en ligne depuis le cache
        try:
            # Parcourir les clés du cache pour trouver les utilisateurs en ligne
            for user in queryset:
                cache_key = f'user_online_{user.id}'
                if cache.get(cache_key, False):
                    online_users_ids.append(user.id)
        except:
            # En cas d'erreur avec le cache, retourner le queryset original
            pass

        if value:
            return queryset.filter(id__in=online_users_ids)
        return queryset.exclude(id__in=online_users_ids)

    def filter_has_profile_picture(self, queryset, name, value):
        """
        Filtre les utilisateurs ayant une photo de profil (avatar).
        """
        if value:
            return queryset.filter(avatar__isnull=False).exclude(avatar='')
        return queryset.filter(Q(avatar__isnull=True) | Q(avatar=''))


class UserProfileFilter(django_filters.FilterSet):
    """
    Filtres pour le modèle UserProfile.
    Permet de filtrer les profils utilisateurs.
    """
    is_public = django_filters.BooleanFilter(field_name='is_public', label="Profil public")
    show_contact_info = django_filters.BooleanFilter(field_name='show_contact_info', label="Afficher infos de contact")
    completion_percentage_gte = django_filters.NumberFilter(
        field_name='completion_percentage', lookup_expr='gte', label="Pourcentage de complétion (>=)"
    )
    completion_percentage_lte = django_filters.NumberFilter(
        field_name='completion_percentage', lookup_expr='lte', label="Pourcentage de complétion (<=)"
    )
    has_bio = django_filters.BooleanFilter(method='filter_has_bio', label="A une bio")
    has_skills = django_filters.BooleanFilter(method='filter_has_json_field', field_name='skills', label="A des compétences")
    has_languages = django_filters.BooleanFilter(method='filter_has_json_field', field_name='languages', label="A des langues")
    has_political_interests = django_filters.BooleanFilter(method='filter_has_json_field', field_name='political_interests', label="A des intérêts politiques")
    has_mentorship_areas = django_filters.BooleanFilter(method='filter_has_json_field', field_name='mentorship_areas', label="A des domaines de mentorat")

    class Meta:
        model = UserProfile
        fields = [
            'is_public', 'show_contact_info', 'completion_percentage_gte',
            'completion_percentage_lte', 'has_bio', 'has_skills',
            'has_languages', 'has_political_interests', 'has_mentorship_areas'
        ]

    def filter_has_bio(self, queryset, name, value):
        if value:
            return queryset.filter(bio__isnull=False).exclude(bio='')
        return queryset.filter(Q(bio__isnull=True) | Q(bio=''))

    def filter_has_json_field(self, queryset, name, value):
        """
        Filtre les profils ayant des données dans un champ JSONField qui est une liste.
        Checks if the list is not empty or null.
        """
        field_name = name.replace('has_', '')  # Enlever le préfixe 'has_'
        
        if value:
            try:
                return queryset.filter(**{f'{field_name}__isnull': False}).exclude(**{f'{field_name}__exact': []})
            except:
                # Fallback si JSONField n'est pas supporté
                return queryset.filter(**{f'{field_name}__isnull': False})
        else:
            try:
                return queryset.filter(Q(**{f'{field_name}__isnull': True}) | Q(**{f'{field_name}__exact': []}))
            except:
                # Fallback si JSONField n'est pas supporté
                return queryset.filter(**{f'{field_name}__isnull': True})