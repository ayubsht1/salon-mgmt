from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    message = "Only staff users can manage appointments."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
