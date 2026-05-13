from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import WorkerAssignment
from ..Serializers.workerAssignment_serializer import WorkerAssignmentSerializer


class WorkerAssignmentListAPIView(generics.ListAPIView):
    queryset = WorkerAssignment.objects.all()
    serializer_class = WorkerAssignmentSerializer

class WorkerAssignmentCreateAPIView(generics.CreateAPIView):
    queryset = WorkerAssignment.objects.all()
    serializer_class = WorkerAssignmentSerializer
    def perform_create(self, serializer):
        print("WorkerAssignment créé")
        serializer.save()

class WorkerAssignmentDetailAPIView(generics.RetrieveAPIView):
    queryset = WorkerAssignment.objects.all()
    serializer_class = WorkerAssignmentSerializer

class WorkerAssignmentUpdateAPIView(generics.UpdateAPIView):
    queryset = WorkerAssignment.objects.all()
    serializer_class = WorkerAssignmentSerializer
    def perform_update(self, serializer):
        print("Modification")
        serializer.save()

class WorkerAssignmentDeleteAPIView(generics.DestroyAPIView):
    queryset = WorkerAssignment.objects.all()
    serializer_class = WorkerAssignmentSerializer
    def perform_destroy(self, instance):
        print("Suppression")
        instance.delete()