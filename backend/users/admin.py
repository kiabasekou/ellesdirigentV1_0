from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.contrib import messages
from django.utils import timezone
from .models import Participante, UserProfile

@admin.register(Participante)
class ParticipanteAdmin(UserAdmin):
    """Administration des participantes avec validation"""
    
    list_display = [
        'username', 'nom_complet', 'email', 'nip', 'region', 'ville',
        'experience', 'statut_badge', 'date_joined', 'document_link'
    ]
    
    list_filter = [
        'statut_validation', 'experience', 'region', 'date_joined',
        'is_active', 'is_staff'
    ]
    
    search_fields = [
        'username', 'first_name', 'last_name', 'email', 'nip', 'phone'
    ]
    
    readonly_fields = [
        'date_joined', 'last_login', 'validated_at',
        'document_preview', 'validation_actions'
    ]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('username', 'first_name', 'last_name', 'email', 'phone')
        }),
        ('Identification', {
            'fields': ('nip', 'date_of_birth')
        }),
        ('Localisation', {
            'fields': ('region', 'ville')
        }),
        ('Expérience politique', {
            'fields': ('experience',)
        }),
        ('Documents', {
            'fields': ('document_justificatif', 'avatar', 'document_preview')
        }),
        ('Validation', {
            'fields': ('statut_validation', 'motif_rejet', 'validated_at', 'validated_by', 'validation_actions'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Dates importantes', {
            'fields': ('date_joined', 'last_login', 'last_activity'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['valider_inscriptions', 'rejeter_inscriptions', 'export_csv']
    
    def nom_complet(self, obj):
        return obj.get_full_name()
    nom_complet.short_description = 'Nom complet'
    
    def statut_badge(self, obj):
        colors = {
            'en_attente': 'orange',
            'validee': 'green',
            'rejetee': 'red'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.statut_validation, 'black'),
            obj.get_statut_validation_display()
        )
    statut_badge.short_description = 'Statut'
    
    def document_link(self, obj):
        if obj.document_justificatif:
            return format_html(
                '<a href="{}" target="_blank">Voir document</a>',
                obj.document_justificatif.url
            )
        return "Aucun document"
    document_link.short_description = 'Document'
    
    def document_preview(self, obj):
        if obj.document_justificatif:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px;" />',
                obj.document_justificatif.url
            )
        return "Aucun document"
    document_preview.short_description = 'Aperçu du document'
    
    def validation_actions(self, obj):
        if obj.statut_validation == 'en_attente':
            return format_html(
                '<a class="button" href="#" onclick="validateUser({})">Valider</a> '
                '<a class="button" href="#" onclick="rejectUser({})">Rejeter</a>',
                obj.pk, obj.pk
            )
        return f"Action effectuée le {obj.validated_at}" if obj.validated_at else "—"
    validation_actions.short_description = 'Actions'
    
    def valider_inscriptions(self, request, queryset):
        updated = 0
        for obj in queryset.filter(statut_validation='en_attente'):
            obj.statut_validation = 'validee'
            obj.validated_at = timezone.now()
            obj.validated_by = request.user
            obj.is_active = True
            obj.save()
            updated += 1
        
        self.message_user(
            request,
            f"{updated} inscription(s) validée(s) avec succès.",
            messages.SUCCESS
        )
    valider_inscriptions.short_description = "Valider les inscriptions sélectionnées"
    
    def rejeter_inscriptions(self, request, queryset):
        updated = 0
        for obj in queryset.filter(statut_validation='en_attente'):
            obj.statut_validation = 'rejetee'
            obj.validated_at = timezone.now()
            obj.validated_by = request.user
            obj.is_active = False
            obj.motif_rejet = "Rejeté en lot par l'administration"
            obj.save()
            updated += 1
        
        self.message_user(
            request,
            f"{updated} inscription(s) rejetée(s) avec succès.",
            messages.SUCCESS
        )
    rejeter_inscriptions.short_description = "Rejeter les inscriptions sélectionnées"
    
    def export_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="participantes.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Username', 'Nom complet', 'Email', 'NIP', 'Téléphone',
            'Région', 'Ville', 'Expérience', 'Statut', 'Date inscription'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.username,
                obj.get_full_name(),
                obj.email,
                obj.nip,
                obj.phone,
                obj.get_region_display(),
                obj.ville,
                obj.get_experience_display(),
                obj.get_statut_validation_display(),
                obj.date_joined.strftime('%Y-%m-%d %H:%M')
            ])
        
        return response
    export_csv.short_description = "Exporter en CSV"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Administration des profils utilisateur"""
    
    list_display = ['user', 'completion_percentage', 'is_public', 'education_level']
    list_filter = ['is_public', 'education_level', 'completion_percentage']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'bio']
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Informations personnelles', {
            'fields': ('bio', 'education_level', 'current_position', 'organization')
        }),
        ('Compétences et intérêts', {
            'fields': ('skills', 'languages', 'political_interests', 'career_goals')
        }),
        ('Réseaux sociaux', {
            'fields': ('website', 'linkedin', 'twitter')
        }),
        ('Paramètres', {
            'fields': ('is_public', 'show_contact_info', 'completion_percentage')
        }),
    )
    
    readonly_fields = ['completion_percentage']