# ============================================================================
# backend/training/serializers.py - CRÉATION MANQUANTE
# ============================================================================
"""
Serializers pour le module de formation
CORRECTION: Création des serializers manquants
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Avg

from .models import Formation, InscriptionFormation, Certificat, ModuleFormation

User = get_user_model()


class ModuleFormationSerializer(serializers.ModelSerializer):
    """Serializer pour les modules de formation"""
    
    # Champs calculés
    est_complete = serializers.SerializerMethodField()
    
    class Meta:
        model = ModuleFormation
        fields = [
            'id', 'formation', 'titre', 'description', 'ordre',
            'duree_minutes', 'contenu', 'objectifs', 'video_url',
            'documents_url', 'ressources_supplementaires', 'quiz',
            'quiz_requis', 'date_creation', 'date_modification',
            'est_complete'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
    
    def get_est_complete(self, obj):
        """Vérifie si le module est complété par l'utilisateur connecté"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                inscription = InscriptionFormation.objects.get(
                    formation=obj.formation,
                    participante=request.user
                )
                return obj in inscription.modules_completes.all()
            except InscriptionFormation.DoesNotExist:
                pass
        return False


class FormationSerializer(serializers.ModelSerializer):
    """Serializer principal pour les formations"""
    
    # Champs calculés
    nb_participants = serializers.SerializerMethodField()
    places_disponibles = serializers.SerializerMethodField()
    est_complete = serializers.SerializerMethodField()
    peut_s_inscrire = serializers.SerializerMethodField()
    est_inscrit = serializers.SerializerMethodField()
    evaluation_moyenne = serializers.SerializerMethodField()
    nb_modules = serializers.SerializerMethodField()
    
    # Champs en lecture seule
    created_by_nom = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Formation
        fields = [
            'id', 'titre', 'slug', 'description', 'description_courte',
            'categorie', 'niveau', 'tags', 'duree_heures', 'date_debut',
            'date_fin', 'lieu', 'adresse_complete', 'est_en_ligne',
            'lien_visioconference', 'max_participants', 'cout',
            'inscription_ouverte', 'date_limite_inscription', 'validation_requise',
            'formateur_nom', 'formateur_bio', 'formateur_photo', 'image_cover',
            'programme_detaille', 'objectifs', 'prerequis', 'materiel_requis',
            'certificat_delivre', 'quiz_requis', 'note_minimale', 'status',
            'est_featured', 'created_by', 'created_by_nom', 'date_creation',
            'date_modification', 'nb_participants', 'places_disponibles',
            'est_complete', 'peut_s_inscrire', 'est_inscrit', 'evaluation_moyenne',
            'nb_modules'
        ]
        read_only_fields = [
            'id', 'slug', 'created_by', 'date_creation', 'date_modification',
            'nb_participants', 'places_disponibles', 'est_complete',
            'peut_s_inscrire', 'est_inscrit', 'evaluation_moyenne', 'nb_modules',
            'created_by_nom'
        ]
    
    def get_nb_participants(self, obj):
        """Nombre de participants inscrits"""
        return obj.inscriptions.filter(
            statut__in=['confirmee', 'en_cours', 'terminee']
        ).count()
    
    def get_places_disponibles(self, obj):
        """Nombre de places disponibles"""
        return obj.places_disponibles
    
    def get_est_complete(self, obj):
        """Vérifie si la formation est complète"""
        return obj.est_complete
    
    def get_peut_s_inscrire(self, obj):
        """Vérifie si l'utilisateur peut s'inscrire"""
        return obj.peut_s_inscrire
    
    def get_est_inscrit(self, obj):
        """Vérifie si l'utilisateur connecté est inscrit"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.inscriptions.filter(
                participante=request.user,
                statut__in=['confirmee', 'en_cours', 'terminee']
            ).exists()
        return False
    
    def get_evaluation_moyenne(self, obj):
        """Calcule l'évaluation moyenne de la formation"""
        evaluations = obj.inscriptions.filter(evaluation_formation__isnull=False)
        if evaluations.exists():
            return round(evaluations.aggregate(
                moyenne=Avg('evaluation_formation')
            )['moyenne'], 2)
        return None
    
    def get_nb_modules(self, obj):
        """Nombre de modules dans la formation"""
        return obj.modules.count()
    
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
                "La date limite d'inscription doit être antérieure au début de la formation"
            )
        
        # Vérifier la cohérence du lieu
        est_en_ligne = data.get('est_en_ligne')
        lieu = data.get('lieu')
        lien_visio = data.get('lien_visioconference')
        
        if not est_en_ligne and not lieu:
            raise serializers.ValidationError(
                "Un lieu doit être spécifié pour les formations en présentiel"
            )
        
        if est_en_ligne and not lien_visio:
            raise serializers.ValidationError(
                "Un lien de visioconférence doit être fourni pour les formations en ligne"
            )
        
        return data


class FormationDetailSerializer(FormationSerializer):
    """Serializer détaillé avec modules et statistiques"""
    
    modules = ModuleFormationSerializer(many=True, read_only=True)
    statistiques = serializers.SerializerMethodField()
    
    class Meta(FormationSerializer.Meta):
        fields = FormationSerializer.Meta.fields + ['modules', 'statistiques']
    
    def get_statistiques(self, obj):
        """Statistiques détaillées de la formation"""
        inscriptions = obj.inscriptions.all()
        
        return {
            'total_inscriptions': inscriptions.count(),
            'inscriptions_confirmees': inscriptions.filter(statut='confirmee').count(),
            'inscriptions_en_cours': inscriptions.filter(statut='en_cours').count(),
            'inscriptions_terminees': inscriptions.filter(statut='terminee').count(),
            'inscriptions_abandonnees': inscriptions.filter(statut='abandonnee').count(),
            'taux_completion': self._calculer_taux_completion(inscriptions),
            'progression_moyenne': self._calculer_progression_moyenne(inscriptions),
        }
    
    def _calculer_taux_completion(self, inscriptions):
        """Calcule le taux de complétion"""
        total = inscriptions.count()
        if total == 0:
            return 0
        terminees = inscriptions.filter(statut='terminee').count()
        return round((terminees / total) * 100, 2)
    
    def _calculer_progression_moyenne(self, inscriptions):
        """Calcule la progression moyenne"""
        inscriptions_actives = inscriptions.filter(
            statut__in=['confirmee', 'en_cours', 'terminee']
        )
        if inscriptions_actives.exists():
            return round(inscriptions_actives.aggregate(
                moyenne=Avg('progression')
            )['moyenne'], 2)
        return 0


class InscriptionFormationSerializer(serializers.ModelSerializer):
    """Serializer pour les inscriptions aux formations"""
    
    # Informations de la formation
    formation_titre = serializers.CharField(source='formation.titre', read_only=True)
    formation_date_debut = serializers.DateTimeField(source='formation.date_debut', read_only=True)
    formation_lieu = serializers.CharField(source='formation.lieu', read_only=True)
    formation_est_en_ligne = serializers.BooleanField(source='formation.est_en_ligne', read_only=True)
    
    # Informations de la participante
    participante_nom = serializers.CharField(source='participante.get_full_name', read_only=True)
    participante_email = serializers.EmailField(source='participante.email', read_only=True)
    
    # Champs calculés
    peut_evaluer = serializers.SerializerMethodField()
    peut_obtenir_certificat = serializers.SerializerMethodField()
    modules_completes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = InscriptionFormation
        fields = [
            'id', 'formation', 'participante', 'date_inscription', 'date_validation',
            'date_debut', 'date_completion', 'statut', 'progression',
            'modules_completes', 'temps_passe', 'derniere_activite',
            'evaluation_formation', 'commentaire_evaluation', 'certificat_genere',
            'note_finale', 'notes_privees', 'formation_titre', 'formation_date_debut',
            'formation_lieu', 'formation_est_en_ligne', 'participante_nom',
            'participante_email', 'peut_evaluer', 'peut_obtenir_certificat',
            'modules_completes_count'
        ]
        read_only_fields = [
            'id', 'date_inscription', 'date_validation', 'certificat_genere',
            'formation_titre', 'formation_date_debut', 'formation_lieu',
            'formation_est_en_ligne', 'participante_nom', 'participante_email',
            'peut_evaluer', 'peut_obtenir_certificat', 'modules_completes_count',
            'derniere_activite'
        ]
    
    def get_peut_evaluer(self, obj):
        """Vérifie si l'inscription peut être évaluée"""
        return (
            obj.statut == 'terminee' and
            obj.formation.est_passee and
            not obj.evaluation_formation
        )
    
    def get_peut_obtenir_certificat(self, obj):
        """Vérifie si l'inscription peut obtenir un certificat"""
        return obj.peut_obtenir_certificat()
    
    def get_modules_completes_count(self, obj):
        """Nombre de modules complétés"""
        return obj.modules_completes.count()
    
    def validate_evaluation_formation(self, value):
        """Valide l'évaluation"""
        if value is not None and not (1 <= value <= 5):
            raise serializers.ValidationError(
                "L'évaluation doit être entre 1 et 5"
            )
        return value
    
    def validate_progression(self, value):
        """Valide la progression"""
        if not (0 <= value <= 100):
            raise serializers.ValidationError(
                "La progression doit être entre 0 et 100"
            )
        return value


class CertificatSerializer(serializers.ModelSerializer):
    """Serializer pour les certificats"""
    
    # Informations de l'inscription
    formation_titre = serializers.CharField(source='inscription.formation.titre', read_only=True)
    participante_nom = serializers.CharField(source='inscription.participante.get_full_name', read_only=True)
    participante_email = serializers.EmailField(source='inscription.participante.email', read_only=True)
    
    # Champs calculés
    est_expire = serializers.SerializerMethodField()
    url_verification = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificat
        fields = [
            'id', 'inscription', 'numero_certificat', 'hash_verification',
            'date_generation', 'date_expiration', 'est_valide',
            'raison_invalidation', 'fichier_pdf', 'formation_titre',
            'participante_nom', 'participante_email', 'est_expire',
            'url_verification'
        ]
        read_only_fields = [
            'id', 'numero_certificat', 'hash_verification', 'date_generation',
            'formation_titre', 'participante_nom', 'participante_email',
            'est_expire', 'url_verification'
        ]
    
    def get_est_expire(self, obj):
        """Vérifie si le certificat est expiré"""
        if not obj.date_expiration:
            return False
        return timezone.now() > obj.date_expiration
    
    def get_url_verification(self, obj):
        """URL de vérification du certificat"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(
                f'/api/training/certificats/{obj.id}/verifier/'
            )
        return None


class FormationListSerializer(serializers.ModelSerializer):
    """Serializer optimisé pour les listes de formations"""
    
    nb_participants = serializers.SerializerMethodField()
    evaluation_moyenne = serializers.SerializerMethodField()
    created_by_nom = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Formation
        fields = [
            'id', 'titre', 'slug', 'description_courte', 'categorie',
            'niveau', 'duree_heures', 'date_debut', 'lieu', 'est_en_ligne',
            'max_participants', 'cout', 'image_cover', 'certificat_delivre',
            'status', 'est_featured', 'created_by_nom', 'nb_participants',
            'evaluation_moyenne'
        ]
    
    def get_nb_participants(self, obj):
        """Nombre de participants"""
        return getattr(obj, 'nb_participants', 0)
    
    def get_evaluation_moyenne(self, obj):
        """Évaluation moyenne"""
        return getattr(obj, 'evaluation_moyenne', None)


class FormationStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques de formations"""
    
    total_formations = serializers.IntegerField()
    formations_actives = serializers.IntegerField()
    total_participants = serializers.IntegerField()
    taux_completion_moyen = serializers.FloatField()
    evaluation_moyenne = serializers.FloatField()
    categories_populaires = serializers.ListField()
    formations_par_mois = serializers.DictField()


class ParticipanteSerializer(serializers.ModelSerializer):
    """Serializer pour les informations des participantes"""
    
    nom_complet = serializers.CharField(source='get_full_name', read_only=True)
    nb_formations = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'nom_complet', 'email', 'date_joined', 'nb_formations']
        read_only_fields = ['id', 'nom_complet', 'email', 'date_joined']


class FormationRapideSerializer(serializers.ModelSerializer):
    """Serializer minimal pour les références rapides"""
    
    created_by_nom = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Formation
        fields = [
            'id', 'titre', 'slug', 'categorie', 'niveau', 'date_debut',
            'est_en_ligne', 'lieu', 'created_by_nom'
        ]


class ModuleProgressionSerializer(serializers.Serializer):
    """Serializer pour la progression dans un module"""
    
    module_id = serializers.IntegerField()
    module_titre = serializers.CharField()
    est_complete = serializers.BooleanField()
    date_completion = serializers.DateTimeField(allow_null=True)
    temps_passe = serializers.DurationField(allow_null=True)


class FormationProgressionSerializer(serializers.Serializer):
    """Serializer pour la progression complète dans une formation"""
    
    formation = FormationRapideSerializer(read_only=True)
    inscription = InscriptionFormationSerializer(read_only=True)
    modules_progression = ModuleProgressionSerializer(many=True, read_only=True)
    statistiques = serializers.DictField(read_only=True)


class CertificatVerificationSerializer(serializers.Serializer):
    """Serializer pour la vérification de certificat"""
    
    numero_certificat = serializers.CharField()
    hash_verification = serializers.CharField()
    formation_titre = serializers.CharField(read_only=True)
    participante_nom = serializers.CharField(read_only=True)
    date_generation = serializers.DateTimeField(read_only=True)
    est_valide = serializers.BooleanField(read_only=True)
    message = serializers.CharField(read_only=True)


class FormationCreationSerializer(serializers.ModelSerializer):
    """Serializer optimisé pour la création de formations"""
    
    modules_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="Liste des modules à créer avec la formation"
    )
    
    class Meta:
        model = Formation
        fields = [
            'titre', 'description', 'description_courte', 'categorie',
            'niveau', 'tags', 'duree_heures', 'date_debut', 'date_fin',
            'lieu', 'adresse_complete', 'est_en_ligne', 'lien_visioconference',
            'max_participants', 'cout', 'inscription_ouverte',
            'date_limite_inscription', 'validation_requise', 'formateur_nom',
            'formateur_bio', 'formateur_photo', 'image_cover',
            'programme_detaille', 'objectifs', 'prerequis', 'materiel_requis',
            'certificat_delivre', 'quiz_requis', 'note_minimale',
            'est_featured', 'modules_data'
        ]
    
    def create(self, validated_data):
        """Création avec modules associés"""
        modules_data = validated_data.pop('modules_data', [])
        
        # Créer la formation
        formation = Formation.objects.create(**validated_data)
        
        # Créer les modules
        for i, module_data in enumerate(modules_data, 1):
            ModuleFormation.objects.create(
                formation=formation,
                ordre=i,
                **module_data
            )
        
        return formation


class InscriptionBulkSerializer(serializers.Serializer):
    """Serializer pour les inscriptions en lot"""
    
    formation_id = serializers.UUIDField()
    participantes_emails = serializers.ListField(
        child=serializers.EmailField(),
        min_length=1,
        max_length=50
    )
    message_personnalise = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True
    )
    
    def validate_formation_id(self, value):
        """Valide que la formation existe et est ouverte"""
        try:
            formation = Formation.objects.get(id=value)
            if not formation.peut_s_inscrire:
                raise serializers.ValidationError(
                    "Cette formation n'est pas ouverte aux inscriptions"
                )
            return value
        except Formation.DoesNotExist:
            raise serializers.ValidationError("Formation non trouvée")
    
    def validate_participantes_emails(self, value):
        """Valide les emails des participantes"""
        emails_valides = []
        emails_invalides = []
        
        for email in value:
            try:
                user = User.objects.get(email=email)
                emails_valides.append(user)
            except User.DoesNotExist:
                emails_invalides.append(email)
        
        if emails_invalides:
            raise serializers.ValidationError(
                f"Utilisatrices non trouvées : {', '.join(emails_invalides)}"
            )
        
        return emails_valides


class FormationCloneSerializer(serializers.Serializer):
    """Serializer pour cloner une formation"""
    
    nouveau_titre = serializers.CharField(max_length=200)
    nouvelle_date_debut = serializers.DateTimeField()
    nouvelle_date_fin = serializers.DateTimeField()
    nouveau_lieu = serializers.CharField(max_length=300, required=False, allow_blank=True)
    copier_modules = serializers.BooleanField(default=True)
    
    def validate(self, data):
        """Validation des dates"""
        if data['nouvelle_date_fin'] <= data['nouvelle_date_debut']:
            raise serializers.ValidationError(
                "La date de fin doit être postérieure à la date de début"
            )
        return data


class EvaluationFormationSerializer(serializers.Serializer):
    """Serializer pour l'évaluation d'une formation"""
    
    note_generale = serializers.IntegerField(
        min_value=1, 
        max_value=5,
        help_text="Note générale de 1 à 5"
    )
    note_contenu = serializers.IntegerField(
        min_value=1, 
        max_value=5,
        help_text="Note du contenu de 1 à 5"
    )
    note_formateur = serializers.IntegerField(
        min_value=1, 
        max_value=5,
        help_text="Note du formateur de 1 à 5"
    )
    note_organisation = serializers.IntegerField(
        min_value=1, 
        max_value=5,
        help_text="Note de l'organisation de 1 à 5"
    )
    commentaire = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Commentaire libre"
    )
    recommande = serializers.BooleanField(
        help_text="Recommanderiez-vous cette formation ?"
    )
    suggestions = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Suggestions d'amélioration"
    )


class FormationAnalyticsSerializer(serializers.Serializer):
    """Serializer pour les analytics de formation"""
    
    periode_debut = serializers.DateField()
    periode_fin = serializers.DateField()
    
    # Statistiques générales
    total_formations = serializers.IntegerField()
    formations_actives = serializers.IntegerField()
    formations_terminees = serializers.IntegerField()
    
    # Inscriptions
    total_inscriptions = serializers.IntegerField()
    inscriptions_confirmees = serializers.IntegerField()
    inscriptions_terminees = serializers.IntegerField()
    taux_completion = serializers.FloatField()
    
    # Évaluations
    note_moyenne = serializers.FloatField()
    nb_evaluations = serializers.IntegerField()
    
    # Tendances
    inscriptions_par_mois = serializers.DictField()
    categories_populaires = serializers.ListField()
    formations_les_mieux_notees = serializers.ListField()
    
    # Géographique
    repartition_par_lieu = serializers.DictField()
    taux_formations_en_ligne = serializers.FloatField()


class ExportFormationSerializer(serializers.Serializer):
    """Serializer pour l'export de formations"""
    
    format_export = serializers.ChoiceField(
        choices=[('csv', 'CSV'), ('excel', 'Excel'), ('pdf', 'PDF')],
        default='csv'
    )
    inclure_modules = serializers.BooleanField(default=True)
    inclure_inscriptions = serializers.BooleanField(default=True)
    inclure_evaluations = serializers.BooleanField(default=False)
    date_debut = serializers.DateField(required=False)
    date_fin = serializers.DateField(required=False)
    categories = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )


class NotificationFormationSerializer(serializers.Serializer):
    """Serializer pour les notifications de formation"""
    
    type_notification = serializers.ChoiceField(
        choices=[
            ('rappel', 'Rappel'),
            ('confirmation', 'Confirmation'),
            ('annulation', 'Annulation'),
            ('modification', 'Modification'),
            ('certificat', 'Certificat disponible')
        ]
    )
    destinataires = serializers.ChoiceField(
        choices=[
            ('tous', 'Tous les inscrits'),
            ('confirmes', 'Inscrits confirmés'),
            ('en_cours', 'En cours de formation'),
            ('personnalise', 'Liste personnalisée')
        ]
    )
    emails_personnalises = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True
    )
    message_personnalise = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True
    )
    programmer_envoi = serializers.BooleanField(default=False)
    date_envoi = serializers.DateTimeField(required=False)
    
    def validate(self, data):
        """Validation des données de notification"""
        if data['destinataires'] == 'personnalise':
            if not data.get('emails_personnalises'):
                raise serializers.ValidationError(
                    "Liste d'emails requise pour destinataires personnalisés"
                )
        
        if data['programmer_envoi']:
            if not data.get('date_envoi'):
                raise serializers.ValidationError(
                    "Date d'envoi requise pour programmer l'envoi"
                )
            if data['date_envoi'] <= timezone.now():
                raise serializers.ValidationError(
                    "La date d'envoi doit être dans le futur"
                )
        
        return data