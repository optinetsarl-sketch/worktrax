from rest_framework.viewsets import ModelViewSet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Type_Worker
from ..Serializers.TypeWorker_serializer import TypeWorkerSerializer 


class TypeWorkerCreateView(generics.CreateAPIView):
    queryset = Type_Worker.objects.all()
    serializer_class = TypeWorkerSerializer
   
class TypeWorkerListView(generics.ListAPIView):
    queryset = Type_Worker.objects.all()
    serializer_class = TypeWorkerSerializer

class TypeWorkerDetailView(generics.RetrieveAPIView):
    queryset = Type_Worker.objects.all()
    serializer_class = TypeWorkerSerializer    

class TypeWorkerUpdateView(generics.UpdateAPIView):
    queryset = Type_Worker.objects.all()
    serializer_class = TypeWorkerSerializer    

class TypeWorkerDeleteView(generics.DestroyAPIView):
    queryset = Type_Worker.objects.all()
    serializer_class = TypeWorkerSerializer

