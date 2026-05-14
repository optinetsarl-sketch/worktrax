from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import User
from ..Serializers.user_serializer import UserSerializer
from rest_framework import viewsets
# from ..permissions import HasTablePermission

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
    # permission_classes = [HasTablePermission]

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated]