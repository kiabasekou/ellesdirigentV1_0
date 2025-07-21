# ============================================================================
# backend/events/serializers.py - VERSION COMPLÈTE
# ============================================================================
"""
Serializers pour le module événements
Gestion de la sérialisation des données pour l'API REST
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Avg

from .models import Event, InscriptionEvent, RappelEvent

User = get_user_model()


class EventSerializer(serializers.ModelSerializer):
    """Serializer principal pour les événements"""
    
    # Champs calculés
    nb_participants = serializers.SerializerMethodField()
    places_disponibles = serializers.SerializerMethodField()
    est_passe = serializers.SerializerMethodField()
    est_en_cours = serializers.SerializerMethodField()
    peut_s_inscrire = serializers.SerializerMethodField()
    est_inscrit = serializers.SerializerMethodField()
    evaluation_moyenne = serializers.SerializerMethodField()
    
    # Champs en lecture seule
    cree_par_nom = serializers.CharField(source='cree_par.get_full_name', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'titre', 'slug', 'description', 'description_courte',
            'categorie', 'tags', 'date_debut', 'date_fin', 'fuseau_horaire',
            'est_en_ligne', 'lieu', 'adresse_complete', 'lien_visioconference',
            'max_participants', 'inscription_requise', 'inscription_ouverte',
            'date_limite_inscription', 'validation_requise', 'liste_attente_activee',
            'formateur_nom', 'formateur_bio', 'image_couverture',
            'programme_detaille', 'objectifs', 'prerequis', 'materiel_requis',
            'statut', 'est_publie', 'est_featured', 'cree_par', 'cree_par_nom',
            'date_creation', 'date_modification', 'notifications_activees',
            'nb_participants', 'places_disponibles', 'est_passe', 'est_en_cours',
            'peut_s_inscrire', 'est_inscrit', 'evaluation_moyenne'
        ]
        read_only_fields = [
            'id', 'slug', 'cree_par', 'date_creation', 'date_modification',
            'nb_participants', 'places_disponibles', 'est_passe', 'est_en_cours',
            'peut_s_inscrire', 'est_inscrit', 'evaluation_moyenne', 'cree_par_nom'
        ]
    
    def get_nb_participants(self, obj):
        """Nombre de participants confirmés"""
        return obj.inscriptions.filter(statut__in=['confirmee', 'presente']).count()
    
    def get_places_disponibles(self, obj):
        """Nombre de places disponibles"""
        participants = self.get_nb_participants(obj)
        return max(0, obj.max_participants - participants)
    
    def get_est_passe(self, obj):
        """Vérifie si l'événement est passé"""
        return obj.date_fin < timezone.now()
    
    def get_est_en_cours(self, obj):
        """Vérifie si l'événement est en cours"""
        now = timezone.now()
        return obj.date_debut <= now <= obj.date_fin
    
    def get_peut_s_inscrire(self, obj):
        """Vérifie si l'utilisateur peut s'inscrire"""
        if not obj.inscription_ouverte:
            return False
        
        if obj.date_limite_inscription and timezone.now() > obj.date_limite_inscription:
            return False
        
        if self.get_places_disponibles(obj) <= 0 and not obj.liste_attente_activee:
            return False
        
        return True
    
    def get_est_inscrit(self, obj):
        """Vérifie si l'utilisateur connecté est inscrit"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.inscriptions.filter(
                participante=request.user,
                statut__in=['confirmee', 'en_attente', 'en_attente_validation', 'presente']
            ).exists()
        return False
    
    def get_evaluation_moyenne(self, obj):
        """Calcule l'évaluation moyenne de l'événement"""
        evaluations = obj.inscriptions.filter(evaluation_event__isnull=False)
        if evaluations.exists():
            return round(evaluations.aggregate(
                moyenne=Avg('evaluation_event')
            )['moyenne'], 2)
        return None
    
    def validate(self, data):
        """Validation personnalisée"""
        # Vérifier la cohérence des dates
        if data.get('date_fin') and data.get('date_debut'):
            if data['date_fin'] <= data['date_debut']:
                raise serializers.ValidationError(
                    "La date de fin doit être postérieure à la date de début"
                )
        
        # Vérifier la date limite d'inscription
        date_limite = data.get('date_limite_inscription')
        date_debut = data.get('date_debut')
        
        if date_limite and date_debut and date_limite >= date_debut:
            raise serializers.ValidationError(
                "La date limite d'inscription doit être antérieure au début de l'événement"
            )
        
        # Vérifier la cohérence du lieu
        est_en_ligne = data.get('est_en_ligne')
        lieu = data.get('lieu')
        lien_visio = data.get('lien_visioconference')
        
        if not est_en_ligne and not lieu:
            raise serializers.ValidationError(
                "Un lieu doit être spécifié pour les événements en présentiel"
            )
        
        if est_en_ligne and not lien_visio:
            raise serializers.ValidationError(
                "Un lien de visioconférence doit être fourni pour les événements en ligne"
            )
        
        return data


class EventDetailSerializer(EventSerializer):
    """Serializer détaillé avec informations supplémentaires"""
    
    # Statistiques détaillées
    inscriptions_stats = serializers.SerializerMethodField()
    prochains_rappels = serializers.SerializerMethodField()
    
    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + [
            'inscriptions_stats', 'prochains_rappels'
        ]
    
    def get_inscriptions_stats(self, obj):
        """Statistiques détaillées des inscriptions"""
        inscriptions = obj.inscriptions.all()
        
        return {
            'total': inscriptions.count(),
            'confirmees': inscriptions.filter(statut='confirmee').count(),
            'en_attente': inscriptions.filter(statut='en_attente').count(),
            'en_attente_validation': inscriptions.filter(statut='en_attente_validation').count(),
            'presentes': inscriptions.filter(statut='presente').count(),
            'absentes': inscriptions.filter(statut='absente').count(),
            'annulees': inscriptions.filter(statut='annulee').count(),
        }
    
    def get_prochains_rappels(self, obj):
        """Prochains rappels programmés"""
        if not obj.notifications_activees:
            return []
        
        rappels = obj.rappels.filter(
            statut='programme',
            date_programmee__gt=timezone.now()
        ).order_by('date_programmee')[:3]
        
        return RappelEventSerializer(rappels, many=True).data


class InscriptionEventSerializer(serializers.ModelSerializer):
    """Serializer pour les inscriptions aux événements"""
    
    # Informations de l'événement
    event_titre = serializers.CharField(source='event.titre', read_only=True)
    event_date_debut = serializers.DateTimeField(source='event.date_debut', read_only=True)
    event_lieu = serializers.CharField(source='event.lieu', read_only=True)
    event_est_en_ligne = serializers.BooleanField(source='event.est_en_ligne', read_only=True)
    event_lien_visio = serializers.URLField(source='event.lien_visioconference', read_only=True)
    
    # Informations de la participante
    participante_nom = serializers.CharField(source='participante.get_full_name', read_only=True)
    participante_email = serializers.EmailField(source='participante.email', read_only=True)
    
    # Champs calculés
    peut_evaluer = serializers.SerializerMethodField()
    peut_annuler = serializers.SerializerMethodField()
    
    class Meta:
        model = InscriptionEvent
        fields = [
            'id', 'event', 'participante', 'statut', 'date_inscription',
            'evaluation_event', 'commentaire_evaluation', 'notes_privees',
            'event_titre', 'event_date_debut', 'event_lieu', 'event_est_en_ligne',
            'event_lien_visio', 'participante_nom', 'participante_email',
            'peut_evaluer', 'peut_annuler'
        ]
        read_only_fields = [
            'id', 'date_inscription', 'event_titre', 'event_date_debut',
            'event_lieu', 'event_est_en_ligne', 'event_lien_visio',
            'participante_nom', 'participante_email', 'peut_evaluer', 'peut_annuler'
        ]
    
    def get_peut_evaluer(self, obj):
        """Vérifie si l'inscription peut être évaluée"""
        return (
            obj.statut == 'presente' and
            obj.event.est_passe and
            not obj.evaluation_event
        )
    
    def get_peut_annuler(self, obj):
        """Vérifie si l'inscription peut être annulée"""
        return (
            obj.statut in ['confirmee', 'en_attente', 'en_attente_validation'] and
            not obj.event.est_passe and
            not obj.event.est_en_cours
        )
    
    def validate_evaluation_event(self, value):
        """Valide l'évaluation"""
        if value is not None and not (1 <= value <= 5):
            raise serializers.ValidationError(
                "L'évaluation doit être entre 1 et 5"
            )
        return value


class RappelEventSerializer(serializers.ModelSerializer):
    """Serializer pour les rappels d'événements"""
    
    # Informations de l'événement
    event_titre = serializers.CharField(source='event.titre', read_only=True)
    event_date_debut = serializers.DateTimeField(source='event.date_debut', read_only=True)
    
    # Informations du destinataire
    destinataire_nom = serializers.CharField(source='destinataire.get_full_name', read_only=True)
    
    # Champs calculés
    peut_etre_envoye = serializers.SerializerMethodField()
    temps_avant_event = serializers.SerializerMethodField()
    
    class Meta:
        model = RappelEvent
        fields = [
            'id', 'event', 'destinataire', 'type_rappel', 'heures_avant',
            'date_programmee', 'date_envoi', 'statut', 'message_personnalise',
            'event_titre', 'event_date_debut', 'destinataire_nom',
            'peut_etre_envoye', 'temps_avant_event'
        ]
        read_only_fields = [
            'id', 'date_programmee', 'date_envoi', 'event_titre',
            'event_date_debut', 'destinataire_nom', 'peut_etre_envoye',
            'temps_avant_event'
        ]
    
    def get_peut_etre_envoye(self, obj):
        """Vérifie si le rappel peut être envoyé"""
        return obj.peut_etre_envoye()
    
    def get_temps_avant_event(self, obj):
        """Temps restant avant l'événement"""
        if obj.event.date_debut > timezone.now():
            delta = obj.event.date_debut - timezone.now()
            return {
                'jours': delta.days,
                'heures': delta.seconds // 3600,
                'minutes': (delta.seconds % 3600) // 60
            }
        return None
    
    def validate(self, data):
        """Validation personnalisée"""
        # Vérifier que l'utilisateur est inscrit à l'événement
        event = data.get('event')
        destinataire = data.get('destinataire')
        
        if event and destinataire:
            if not InscriptionEvent.objects.filter(
                event=event,
                destinataire=destinataire,
                statut__in=['confirmee', 'presente']
            ).exists():
                raise serializers.ValidationError(
                    "Le destinataire doit être inscrit à l'événement"
                )
        
        return data


class EventStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques d'événements"""
    
    total_events = serializers.IntegerField()
    events_a_venir = serializers.IntegerField()
    events_en_cours = serializers.IntegerField()
    events_passes = serializers.IntegerField()
    total_inscriptions = serializers.IntegerField()
    taux_participation = serializers.FloatField()
    evaluation_moyenne = serializers.FloatField()
    categories_populaires = serializers.ListField()
    inscriptions_par_mois = serializers.DictField()


class ParticipantSerializer(serializers.ModelSerializer):
    """Serializer pour les informations des participants"""
    
    nom_complet = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'nom_complet', 'email', 'date_joined']
        read_only_fields = ['id', 'nom_complet', 'email', 'date_joined']


class EventCalendrierSerializer(serializers.ModelSerializer):
    """Serializer optimisé pour l'affichage calendrier"""
    
    class Meta:
        model = Event
        fields = [
            'id', 'titre', 'date_debut', 'date_fin', 'categorie',
            'est_en_ligne', 'lieu', 'est_featured'
        ]