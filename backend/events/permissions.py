# ============================================================================
# backend/events/permissions.py
# ============================================================================
"""
Permissions personnalisées pour les événements
"""
from rest_framework import permissions


class EventPermissions(permissions.BasePermission):
    """Permissions pour les événements"""
    
    def has_permission(self, request, view):
        """Permission au niveau de la vue"""
        if view.action in ['list', 'retrieve', 'calendar']:
            return True
        
        if view.action in ['create']:
            return request.user.is_authenticated
        
        if view.action in ['statistiques']:
            return request.user.is_authenticated and request.user.is_staff
        
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Permission au niveau de l'objet"""
        # Lecture libre pour les événements publiés
        if view.action in ['retrieve'] and obj.est_publie:
            return True
        
        # Organisateur ou staff peuvent tout faire
        if request.user.is_staff or obj.organisateur == request.user:
            return True
        
        # Actions spécifiques pour les utilisateurs authentifiés
        if view.action in ['inscrire', 'desinscrire']:
            return request.user.is_authenticated
        
        return False


class InscriptionPermissions(permissions.BasePermission):
    """Permissions pour les inscriptions"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # L'utilisateur peut gérer ses propres inscriptions
        if obj.participante == request.user:
            return True
        
        # L'organisateur peut voir les inscriptions à ses événements
        if obj.event.organisateur == request.user:
            return True
        
        # Le staff peut tout voir
        return request.user.is_staff