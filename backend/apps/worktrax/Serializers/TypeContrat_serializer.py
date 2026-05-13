from rest_framework import serializers
from ..models import TypeContrat

class TypeContratSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeContrat
        fields = '__all__'