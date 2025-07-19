from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée pour n'autoriser les propriétaires d'un objet
    qu'à le modifier ou le supprimer. Les autres utilisateurs peuvent seulement le lire.
    """
    def has_object_permission(self, request, view, obj):
        # Les permissions de lecture sont autorisées pour toute requête GET, HEAD ou OPTIONS.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Les permissions d'écriture ne sont autorisées qu'au propriétaire de l'objet.
        # Supposons que l'objet a un attribut 'user' ou 'owner' qui pointe vers l'utilisateur.
        # Si votre modèle Participante est directement l'objet, utilisez `obj == request.user`.
        # Si c'est un profil lié à l'utilisateur, utilisez `obj.user == request.user`.
        # Pour le modèle Participante, c'est directement l'utilisateur.
        return obj == request.user


class IsValidatedUser(permissions.BasePermission):
    """
    Permission personnalisée pour n'autoriser l'accès qu'aux utilisateurs
    dont le statut de validation est 'validee'.
    """
    message = "Votre compte n'est pas encore validé."

    def has_permission(self, request, view):
        # Vérifie si l'utilisateur est authentifié et si son statut de validation est 'validee'.
        # Assurez-vous que votre modèle Participante a un champ 'statut_validation'.
        return request.user and request.user.is_authenticated and request.user.statut_validation == 'validee'

    def has_object_permission(self, request, view, obj):
        # Pour les permissions au niveau de l'objet, applique la même logique.
        return self.has_permission(request, view)