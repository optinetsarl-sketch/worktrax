from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Machine
from ..Serializers.machine_serializer import MachineSerializer



class MachineListAPIView(generics.ListAPIView):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer

class MachineCreateAPIView(generics.CreateAPIView):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    def perform_create(self, serializer):
        print("Machine créée")
        serializer.save()

class MachineDetailAPIView(generics.RetrieveAPIView):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer

class MachineUpdateAPIView(generics.UpdateAPIView):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    def perform_update(self, serializer):
        print("Modification")
        serializer.save()

class MachineDeleteAPIView(generics.DestroyAPIView):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    def perform_destroy(self, instance):
        print("Suppression")
        instance.delete()