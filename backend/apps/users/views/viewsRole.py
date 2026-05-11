from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Role
from ..Serializers.role_serializer import RoleSerializer

class RoleListCreateView(generics.ListCreateAPIView):

    queryset = Role.objects.all()

    serializer_class = RoleSerializer

    # permission_classes = [IsAuthenticated]