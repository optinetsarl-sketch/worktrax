from rest_framework import serializers
from ..models import Worker
class WorkerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Worker

        fields = [
            "id",
            "first_name",
            "last_name",
            "gender",
            "phone",
            "address",
            "national_id",
            "salary_per_day",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at"
        ]