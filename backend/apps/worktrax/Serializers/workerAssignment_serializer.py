from rest_framework import serializers
from ..models import WorkerAssignment

class WorkerAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerAssignment
        fields = "__all__"
        read_only_fields = [
            "id"
        ]