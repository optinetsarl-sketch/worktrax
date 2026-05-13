from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Societe
from ..Serializers.Societe_serializer import SocieteSerializer

class SocieteListCreateView(generics.ListCreateAPIView):
    queryset = Societe.objects.all()
    serializer_class = SocieteSerializer


class SocieteDetailView(generics.RetrieveAPIView):
    queryset = Societe.objects.all()
    serializer_class = SocieteSerializer


class SocieteUpdateView(generics.UpdateAPIView):
    queryset = Societe.objects.all()
    serializer_class = SocieteSerializer


class SocieteDeleteView(generics.DestroyAPIView):
    queryset = Societe.objects.all()
    serializer_class = SocieteSerializer