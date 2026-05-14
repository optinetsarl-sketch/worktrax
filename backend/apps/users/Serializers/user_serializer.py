from rest_framework import serializers
from ..models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    # class Meta:
    #     model = User
    #     fields = "id", "username", "email", "password", "role"
    # def to_representation(self, instance):
    #     data = super().to_representation(instance)
    #     user = self.context['request'].user
    #     permissions = ColumnPermission.objects.filter(
    #         role=user.role,
    #         table_name="user" 
    #     )
    #     for perm in permissions:
    #         if not perm.can_view:
    #             data.pop(perm.column_name, None)
    #     return data
    




    