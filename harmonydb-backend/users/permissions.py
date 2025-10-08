from rest_framework.permissions import BasePermission

class IsEmailVerified(BasePermission):
    message = "Email is not verified."

    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and getattr(user, "email_verified", False)
