from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import TypeContrat
from ..Serializers.TypeContrat_serializer import TypeContratSerializer

class TypeContratCreateView(generics.CreateAPIView):
    queryset = TypeContrat.objects.all()
    serializer_class = TypeContratSerializer

class TypeContratListView(generics.ListAPIView):
    queryset = TypeContrat.objects.all()
    serializer_class = TypeContratSerializer


class TypeContratDetailView(generics.RetrieveAPIView):
    queryset = TypeContrat.objects.all()
    serializer_class = TypeContratSerializer


class TypeContratUpdateView(generics.UpdateAPIView):
    queryset = TypeContrat.objects.all()
    serializer_class = TypeContratSerializer


class TypeContratDeleteView(generics.DestroyAPIView):
    queryset = TypeContrat.objects.all()
    serializer_class = TypeContratSerializer