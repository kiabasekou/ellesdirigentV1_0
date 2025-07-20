"""
Interface d'administration pour les événements
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import Event, InscriptionEvent, RappelEvent


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Administration des événements"""
    
    list_display = [
        'titre', 'categorie', 'date_debut', 'statut', 'nb_participants',
        'places_disponibles', 'est_publie', 'created_actions'
    ]
    list_filter = [
        'categorie', 'statut', 'est_en_ligne', 'est_publie',
        'date_debut', 'date_creation'
    ]
    search_fields = ['titre', 'description', 'formateur_nom', 'lieu']
    readonly_fields = ['slug', 'date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('titre', 'slug', 'description', 'description_courte', 'categorie', 'tags')
        }),
        ('Dates et horaires', {
            'fields': ('date_debut', 'date_fin', 'fuseau_horaire', 'date_limite_inscription')
        }),
        ('Localisation', {
            'fields': ('est_en_ligne', 'lieu', 'adresse_complete', 'lien_visioconference')
        }),
        ('Gestion des participants', {
            'fields': ('max_participants', 'inscription_requise', 'inscription_ouverte', 'validation_requise')
        }),
        ('Formateur', {
            'fields': ('formateur_nom', 'formateur_bio', 'formateur_photo')
        }),
        ('Contenu', {
            'fields': ('image_couverture', 'programme_detaille', 'objectifs', 'prerequis', 'materiel_requis')
        }),
        ('Statut et publication', {
            'fields': ('statut', 'est_publie', 'est_featured')
        }),
        ('Notifications', {
            'fields': ('notifications_activees', 'rappels_automatiques', 'message_confirmation')
        }),
        ('Métadonnées', {
            'fields': ('organisateur', 'cree_par', 'date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            nb_participants=Count('inscriptions', filter=models.Q(inscriptions__statut='confirmee'))
        )
    
    def nb_participants(self, obj):
        return obj.nb_participants
    nb_participants.short_description = 'Participants'
    nb_participants.admin_order_field = 'nb_participants'
    
    def created_actions(self, obj):
        """Actions rapides"""
        links = []
        
        if obj.inscriptions.exists():
            url = reverse('admin:events_inscriptionevent_changelist')
            links.append(f'<a href="{url}?event__id={obj.id}">Voir inscriptions</a>')
        
        return format_html(' | '.join(links)) if links else '-'
    created_actions.short_description = 'Actions'


@admin.register(InscriptionEvent)
class InscriptionEventAdmin(admin.ModelAdmin):
    """Administration des inscriptions"""
    
    list_display = [
        'participante', 'event', 'date_inscription', 'statut',
        'evaluation_event', 'date_arrivee'
    ]
    list_filter = [
        'statut', 'event__categorie', 'date_inscription',
        'evaluation_event', 'event'
    ]
    search_fields = [
        'participante__first_name', 'participante__last_name',
        'participante__email', 'event__titre'
    ]
    readonly_fields = ['date_inscription', 'ip_inscription', 'user_agent']
    
    fieldsets = (
        ('Inscription', {
            'fields': ('event', 'participante', 'date_inscription', 'statut')
        }),
        ('Informations personnalisées', {
            'fields': ('commentaire_inscription', 'besoins_specifiques', 'motivations')
        }),
        ('Validation', {
            'fields': ('validee_par', 'date_validation', 'commentaire_validation')
        }),
        ('Participation', {
            'fields': ('date_arrivee', 'date_depart', 'evaluation_event', 'commentaire_evaluation')
        }),
        ('Métadonnées', {
            'fields': ('ip_inscription', 'user_agent'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['confirmer_inscriptions', 'marquer_presentes']
    
    def confirmer_inscriptions(self, request, queryset):
        """Action pour confirmer plusieurs inscriptions"""
        count = queryset.filter(statut='en_attente').update(statut='confirmee')
        self.message_user(request, f'{count} inscription(s) confirmée(s)')
    confirmer_inscriptions.short_description = 'Confirmer les inscriptions sélectionnées'
    
    def marquer_presentes(self, request, queryset):
        """Action pour marquer comme présentes"""
        count = queryset.filter(statut='confirmee').update(
            statut='presente',
            date_arrivee=timezone.now()
        )
        self.message_user(request, f'{count} participant(s) marqué(s) comme présent(s)')
    marquer_presentes.short_description = 'Marquer comme présentes'


@admin.register(RappelEvent)
class RappelEventAdmin(admin.ModelAdmin):
    """Administration des rappels"""
    
    list_display = [
        'event', 'destinataire', 'type_rappel', 'heures_avant',
        'date_programmee', 'statut', 'date_envoi'
    ]
    list_filter = [
        'type_rappel', 'statut', 'heures_avant',
        'date_programmee', 'date_envoi'
    ]
    search_fields = [
        'event__titre', 'destinataire__first_name',
        'destinataire__last_name', 'destinataire__email'
    ]
    readonly_fields = ['date_creation', 'date_envoi', 'erreur_envoi']

