from rest_framework import serializers
from .models import Formation, Module, InscriptionFormation, Certificat
from quiz.serializers import QuizSerializer

class ModuleSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = Module
        fields = '__all__'

class FormationListSerializer(serializers.ModelSerializer):
    places_disponibles = serializers.ReadOnlyField()
    est_complete = serializers.ReadOnlyField()
    participants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Formation
        fields = [
            'id', 'titre', 'slug', 'description', 'categorie', 'niveau',
            'duree_heures', 'date_debut', 'date_fin', 'lieu', 'est_en_ligne',
            'max_participants', 'places_disponibles', 'est_complete',
            'participants_count', 'cout', 'formateur', 'image_cover',
            'certificat_delivre', 'quiz_requis'
        ]
    
    def get_participants_count(self, obj):
        return obj.participants.count()

class FormationDetailSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    places_disponibles = serializers.ReadOnlyField()
    est_complete = serializers.ReadOnlyField()
    est_ouverte = serializers.ReadOnlyField()
    participants_count = serializers.SerializerMethodField()
    user_inscription = serializers.SerializerMethodField()
    
    class Meta:
        model = Formation
        fields = '__all__'
    
    def get_participants_count(self, obj):
        return obj.participants.count()
    
    def get_user_inscription(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                inscription = InscriptionFormation.objects.get(
                    formation=obj, participante=request.user
                )
                return InscriptionFormationSerializer(inscription).data
            except InscriptionFormation.DoesNotExist:
                return None
        return None

class InscriptionFormationSerializer(serializers.ModelSerializer):
    formation_titre = serializers.CharField(source='formation.titre', read_only=True)
    progression_calculee = serializers.SerializerMethodField()
    
    class Meta:
        model = InscriptionFormation
        fields = '__all__'
        read_only_fields = ['progression', 'certificat_genere', 'date_completion']
    
    def get_progression_calculee(self, obj):
        return obj.calculer_progression()

class CertificatSerializer(serializers.ModelSerializer):
    formation_titre = serializers.CharField(source='inscription.formation.titre', read_only=True)
    participante_nom = serializers.CharField(source='inscription.participante.get_full_name', read_only=True)
    
    class Meta:
        model = Certificat
        fields = '__all__'
        read_only_fields = ['numero_certificat', 'hash_verification']