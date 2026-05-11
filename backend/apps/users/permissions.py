from rest_framework.permissions import BasePermission
from .models import Permission

class HasTablePermission(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        table = view.basename

        perm = Permission.objects.filter(
            role=request.user.role,
            table_name=table
        ).first()

        if not perm:
            return False

        if request.method == "GET":
            return perm.can_view
        elif request.method == "POST":
            return perm.can_create
        elif request.method in ["PUT", "PATCH"]:
            return perm.can_update
        elif request.method == "DELETE":
            return perm.can_delete
        return False