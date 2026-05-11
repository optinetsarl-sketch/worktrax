from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Worker
from ..Serializers.workers_serializer import WorkerSerializer



class WorkerListAPIView(generics.ListAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer


class WorkerCreateAPIView(generics.CreateAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    def perform_create(self, serializer):
        print("Ouvrier créé")
        serializer.save()

class WorkerDetailAPIView(generics.RetrieveAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer

class WorkerUpdateAPIView(generics.UpdateAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    def perform_update(self, serializer):
        print("Modification")
        serializer.save()

class WorkerDeleteAPIView(generics.DestroyAPIView):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    def perform_destroy(self, instance):
        print("Suppression")
        instance.delete()
