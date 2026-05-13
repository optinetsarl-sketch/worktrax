from rest_framework import serializers
from ..models import Type_Worker

class TypeWorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type_Worker
        fields = '__all__'
    def validate_name(self, value):
        if Type_Worker.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                "Ce type d'ouvrier existe déjà."
            )
        return value    