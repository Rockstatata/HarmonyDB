from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsEmailVerified(BasePermission):
    message = "Email is not verified."

    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and getattr(user, "email_verified", False)

class IsArtistOrReadOnly(BasePermission):
    """
    Permission that allows only artists to create/edit content.
    Everyone can read.
    """
    message = "Only artists can create or modify content."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'artist'
        )

class IsOwnerOrReadOnly(BasePermission):
    """
    Permission that allows only the owner of an object to edit/delete it.
    Everyone can read.
    """
    message = "You can only modify your own content."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        
        # Check if the object has an owner field (user, artist, etc.)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'artist'):
            return obj.artist == request.user
        return False

class IsArtist(BasePermission):
    """
    Permission that allows only artists.
    """
    message = "Only artists can access this resource."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'artist'
        )
