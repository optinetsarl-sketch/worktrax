from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Site
from ..Serializers.site_serializer import SiteSerializer


class SiteListAPIView(generics.ListAPIView):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer


class SiteCreateAPIView(generics.CreateAPIView):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    def perform_create(self, serializer):
        print("Site créé")
        serializer.save()

class SiteDetailAPIView(generics.RetrieveAPIView):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer

class SiteUpdateAPIView(generics.UpdateAPIView):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    def perform_update(self, serializer):
        print("Modification")
        serializer.save()

class SiteDeleteAPIView(generics.DestroyAPIView):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    def perform_destroy(self, instance):
        print("Suppression")
        instance.delete()