# ============================================================================
# backend/events/permissions.py
# ============================================================================
"""
Permissions personnalisées pour le module événements
Gestion fine des autorisations selon les rôles et contextes
"""
from rest_framework import permissions
from django.utils import timezone


class EventPermissions(permissions.BasePermission):
    """Permissions pour les événements"""
    
    def has_permission(self, request, view):
        """Permission au niveau de la vue"""
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Création autorisée pour les utilisateurs authentifiés
        if request.method == 'POST':
            return request.user.is_authenticated
        
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Permission au niveau de l'objet"""
        # Lecture : événements publiés pour tous, non publiés pour créateurs/admins
        if request.method in permissions.SAFE_METHODS:
            if obj.est_publie:
                return True
            return request.user.is_staff or obj.cree_par == request.user
        
        # Modification/suppression : créateur ou admin
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_staff or obj.cree_par == request.user
        
        return False


class InscriptionPermissions(permissions.BasePermission):
    """Permissions pour les inscriptions"""
    
    def has_permission(self, request, view):
        """Permission au niveau de la vue"""
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Permission au niveau de l'objet"""
        # Les utilisateurs peuvent voir/modifier leurs propres inscriptions
        if obj.participante == request.user:
            return True
        
        # Les organisateurs peuvent voir les inscriptions à leurs événements
        if obj.event.cree_par == request.user:
            return True
        
        # Les admins peuvent tout voir
        return request.user.is_staff


class RappelPermissions(permissions.BasePermission):
    """Permissions pour les rappels"""
    
    def has_permission(self, request, view):
        """Permission au niveau de la vue"""
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Permission au niveau de l'objet"""
        # Les utilisateurs peuvent voir/modifier leurs propres rappels
        if obj.destinataire == request.user:
            return True
        
        # Les organisateurs peuvent gérer les rappels de leurs événements
        if obj.event.cree_par == request.user:
            return True
        
        # Les admins peuvent tout gérer
        return request.user.is_staff


class EventCreationPermission(permissions.BasePermission):
    """Permission spécifique pour la création d'événements"""
    
    def has_permission(self, request, view):
        """Vérifie si l'utilisateur peut créer un événement"""
        if not request.user.is_authenticated:
            return False
        
        # Vérifier si l'utilisateur a le rôle approprié
        # Ici vous pourriez ajouter une logique spécifique selon les rôles
        # Par exemple, seules les organisatrices confirmées peuvent créer
        
        return True  # Pour l'instant, tous les utilisateurs authentifiés peuvent créer


class EventModerationPermission(permissions.BasePermission):
    """Permission pour la modération des événements"""
    
    def has_permission(self, request, view):
        """Seuls les modérateurs et admins peuvent modérer"""
        return request.user.is_staff or hasattr(request.user, 'is_moderator')
    
    def has_object_permission(self, request, view, obj):
        """Permission au niveau de l'objet pour la modération"""
        return request.user.is_staff or (
            hasattr(request.user, 'is_moderator') and request.user.is_moderator
        )


class AnalyticsPermission(permissions.BasePermission):
    """Permission pour accéder aux analytiques"""
    
    def has_permission(self, request, view):
        """Permission au niveau de la vue"""
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Permission pour voir les analytiques d'un événement"""
        # Seuls les créateurs et admins peuvent voir les analytiques
        return request.user.is_staff or obj.cree_par == request.user


class InscriptionManagementPermission(permissions.BasePermission):
    """Permission pour gérer les inscriptions (confirmation, présence, etc.)"""
    
    def has_object_permission(self, request, view, obj):
        """Permission pour gérer une inscription"""
        # L'utilisateur peut gérer sa propre inscription (annulation)
        if obj.participante == request.user and view.action in ['destroy', 'update']:
            return True
        
        # Les organisateurs peuvent gérer les inscriptions à leurs événements
        if obj.event.cree_par == request.user:
            return True
        
        # Les admins peuvent tout gérer
        return request.user.is_staff


class EventPublishPermission(permissions.BasePermission):
    """Permission pour publier/dépublier des événements"""
    
    def has_object_permission(self, request, view, obj):
        """Permission pour publier un événement"""
        # Seuls les créateurs et admins peuvent publier
        if request.user.is_staff or obj.cree_par == request.user:
            return True
        
        # Ajouter ici d'autres règles métier si nécessaire
        # Par exemple, vérifier que l'événement respecte certains critères
        
        return False


class BulkActionPermission(permissions.BasePermission):
    """Permission pour les actions en lot"""
    
    def has_permission(self, request, view):
        """Seuls les admins peuvent faire des actions en lot"""
        return request.user.is_staff


def can_user_register_to_event(user, event):
    """
    Fonction utilitaire pour vérifier si un utilisateur peut s'inscrire à un événement
    """
    # Vérifications de base
    if not event.inscription_ouverte:
        return False, "Les inscriptions sont fermées"
    
    if event.date_limite_inscription and timezone.now() > event.date_limite_inscription:
        return False, "Date limite d'inscription dépassée"
    
    # Vérifier si déjà inscrit
    from .models import InscriptionEvent
    if InscriptionEvent.objects.filter(event=event, participante=user).exists():
        return False, "Déjà inscrit à cet événement"
    
    # Vérifier la capacité
    inscriptions_confirmees = InscriptionEvent.objects.filter(
        event=event, 
        statut__in=['confirmee', 'presente']
    ).count()
    
    if inscriptions_confirmees >= event.max_participants:
        if event.liste_attente_activee:
            return True, "Inscription possible en liste d'attente"
        else:
            return False, "Événement complet"
    
    return True, "Inscription autorisée"


def can_user_cancel_registration(user, inscription):
    """
    Fonction utilitaire pour vérifier si un utilisateur peut annuler son inscription
    """
    # Vérifier que c'est bien son inscription
    if inscription.participante != user:
        return False, "Inscription non autorisée"
    
    # Vérifier le statut de l'inscription
    if inscription.statut not in ['confirmee', 'en_attente', 'en_attente_validation']:
        return False, "Impossible d'annuler cette inscription"
    
    # Vérifier que l'événement n'est pas déjà passé ou en cours
    if inscription.event.est_passe or inscription.event.est_en_cours:
        return False, "Impossible d'annuler après le début de l'événement"
    
    # Vérifier s'il y a une limite de temps pour l'annulation
    # (par exemple, pas d'annulation 24h avant l'événement)
    from datetime import timedelta
    limite_annulation = inscription.event.date_debut - timedelta(hours=24)
    if timezone.now() > limite_annulation:
        return False, "Délai d'annulation dépassé (24h avant l'événement)"
    
    return True, "Annulation autorisée"


def can_user_evaluate_event(user, inscription):
    """
    Fonction utilitaire pour vérifier si un utilisateur peut évaluer un événement
    """
    # Vérifier que c'est bien son inscription
    if inscription.participante != user:
        return False, "Évaluation non autorisée"
    
    # Vérifier que l'utilisateur était présent
    if inscription.statut != 'presente':
        return False, "Seules les participantes présentes peuvent évaluer"
    
    # Vérifier que l'événement est terminé
    if not inscription.event.est_passe:
        return False, "L'événement doit être terminé pour être évalué"
    
    # Vérifier qu'il n'a pas déjà évalué
    if inscription.evaluation_event is not None:
        return False, "Événement déjà évalué"
    
    return True, "Évaluation autorisée"


class EventFilterPermission(permissions.BasePermission):
    """Permission pour filtrer les événements selon le contexte"""
    
    def filter_queryset_for_user(self, queryset, user):
        """
        Filtre le queryset d'événements selon les permissions de l'utilisateur
        """
        if not user.is_authenticated:
            # Utilisateurs non connectés : événements publics uniquement
            return queryset.filter(est_publie=True)
        
        if user.is_staff:
            # Admins : tous les événements
            return queryset
        
        # Utilisateurs connectés : événements publics + leurs propres événements
        return queryset.filter(
            models.Q(est_publie=True) | models.Q(cree_par=user)
        )


class CapacityManagementPermission(permissions.BasePermission):
    """Permission pour gérer la capacité des événements"""
    
    def has_object_permission(self, request, view, obj):
        """Permission pour modifier la capacité"""
        # Seuls les créateurs et admins peuvent modifier la capacité
        if not (request.user.is_staff or obj.cree_par == request.user):
            return False
        
        # Vérifier qu'on ne réduit pas en dessous du nombre d'inscrits
        if 'max_participants' in request.data:
            nouveau_max = request.data['max_participants']
            inscrits_confirmes = obj.inscriptions.filter(
                statut__in=['confirmee', 'presente']
            ).count()
            
            if nouveau_max < inscrits_confirmes:
                return False
        
        return True


class NotificationPermission(permissions.BasePermission):
    """Permission pour gérer les notifications"""
    
    def has_object_permission(self, request, view, obj):
        """Permission pour gérer les notifications d'un événement"""
        # Seuls les créateurs et admins peuvent gérer les notifications
        return request.user.is_staff or obj.cree_par == request.user


class ExportDataPermission(permissions.BasePermission):
    """Permission pour exporter les données"""
    
    def has_permission(self, request, view):
        """Permission pour exporter des données"""
        # Seuls les utilisateurs avec des droits spéciaux peuvent exporter
        return request.user.is_staff or hasattr(request.user, 'can_export_data')
    
    def has_object_permission(self, request, view, obj):
        """Permission pour exporter les données d'un événement"""
        # Créateurs et admins peuvent exporter les données de leurs événements
        return request.user.is_staff or obj.cree_par == request.user


# Décorateurs pour vérifier les permissions rapidement
def require_event_owner(func):
    """Décorateur pour vérifier que l'utilisateur est propriétaire de l'événement"""
    def wrapper(request, event_id, *args, **kwargs):
        from .models import Event
        from django.shortcuts import get_object_or_404
        from rest_framework.exceptions import PermissionDenied
        
        event = get_object_or_404(Event, pk=event_id)
        if not (request.user.is_staff or event.cree_par == request.user):
            raise PermissionDenied("Accès non autorisé")
        
        return func(request, event_id, *args, **kwargs)
    return wrapper


def require_inscription_owner(func):
    """Décorateur pour vérifier que l'utilisateur est propriétaire de l'inscription"""
    def wrapper(request, inscription_id, *args, **kwargs):
        from .models import InscriptionEvent
        from django.shortcuts import get_object_or_404
        from rest_framework.exceptions import PermissionDenied
        
        inscription = get_object_or_404(InscriptionEvent, pk=inscription_id)
        if not (request.user.is_staff or 
                inscription.participante == request.user or 
                inscription.event.cree_par == request.user):
            raise PermissionDenied("Accès non autorisé")
        
        return func(request, inscription_id, *args, **kwargs)
    return wrapper