from rest_framework import serializers
from ...Fingerprint.models import UserFingerprint

class UserFingerprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFingerprint
        fields = '__all__'