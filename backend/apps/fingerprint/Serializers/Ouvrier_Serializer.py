from rest_framework import serializers
from ..models import OuvrierFingerprint

class OuvrierFingerprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = OuvrierFingerprint
        fields = '__all__'

class OuvrierFaceRegisterSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField(required=False)
    # user_id = serializers.IntegerField(required=False)
    image = serializers.ImageField()

class FaceLoginSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)
    image = serializers.ImageField()