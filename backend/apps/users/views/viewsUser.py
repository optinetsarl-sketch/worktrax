from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import User
from ..Serializers.user_serializer import UserSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

# from ..permissions import HasTablePermission

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
    # permission_classes = [HasTablePermission]

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated]
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer    
    permission_classes = [IsAdminUser]