
# ============================================================================
# backend/events/filters.py
# ============================================================================
"""
Filtres pour les événements
"""
import django_filters
from django.db.models import Q, Count, F
from .models import Event


class EventFilter(django_filters.FilterSet):
    """Filtre pour les événements"""
    
    categorie = django_filters.ChoiceFilter(choices=Event.CATEGORIES)
    date_debut_min = django_filters.DateTimeFilter(field_name='date_debut', lookup_expr='gte')
    date_debut_max = django_filters.DateTimeFilter(field_name='date_debut', lookup_expr='lte')
    est_en_ligne = django_filters.BooleanFilter()
    places_disponibles = django_filters.BooleanFilter(method='filter_places_disponibles')
    organisateur = django_filters.NumberFilter(field_name='organisateur__id')
    
    def filter_places_disponibles(self, queryset, name, value):
        """Filtre les événements avec places disponibles"""
        if value:
            return queryset.annotate(
                nb_inscrits=Count('inscriptions', filter=Q(inscriptions__statut='confirmee'))
            ).filter(nb_inscrits__lt=F('max_participants'))
        return queryset
    
    class Meta:
        model = Event
        fields = [
            'categorie', 'date_debut_min', 'date_debut_max',
            'est_en_ligne', 'places_disponibles', 'organisateur'
        ]