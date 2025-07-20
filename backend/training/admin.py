from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Formation, Module, InscriptionFormation, Certificat

@admin.register(Formation)
class FormationAdmin(admin.ModelAdmin):
    list_display = ['titre', 'categorie', 'niveau', 'date_debut', 'participants_count', 'status']
    list_filter = ['categorie', 'niveau', 'status', 'est_en_ligne']
    search_fields = ['titre', 'formateur']
    prepopulated_fields = {'slug': ('titre',)}
    date_hierarchy = 'date_debut'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('titre', 'slug', 'description', 'objectifs', 'prerequis')
        }),
        ('Classification', {
            'fields': ('categorie', 'niveau', 'status')
        }),
        ('Planning', {
            'fields': ('date_debut', 'date_fin', 'duree_heures')
        }),
        ('Logistique', {
            'fields': ('lieu', 'est_en_ligne', 'lien_visio', 'max_participants', 'cout', 'materiel_requis')
        }),
        ('Formateur', {
            'fields': ('formateur', 'formateur_bio', 'formateur_photo')
        }),
        ('Médias', {
            'fields': ('image_cover', 'documents')
        }),
        ('Évaluation', {
            'fields': ('certificat_delivre', 'quiz_requis', 'note_minimale')
        })
    )
    
    def participants_count(self, obj):
        return obj.participants.count()
    participants_count.short_description = 'Participants'

@admin.register(InscriptionFormation)
class InscriptionFormationAdmin(admin.ModelAdmin):
    list_display = ['participante', 'formation', 'statut', 'progression', 'date_inscription']
    list_filter = ['statut', 'formation__categorie', 'date_inscription']
    search_fields = ['participante__username', 'formation__titre']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('participante', 'formation')

@admin.register(Certificat)
class CertificatAdmin(admin.ModelAdmin):
    list_display = ['numero_certificat', 'inscription', 'date_generation', 'est_valide']
    list_filter = ['est_valide', 'date_generation']
    search_fields = ['numero_certificat', 'inscription__participante__username']
    readonly_fields = ['numero_certificat', 'hash_verification']