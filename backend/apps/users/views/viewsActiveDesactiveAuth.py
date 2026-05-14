from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.permissions import IsAdminUser

class ToggleUserActiveView(APIView):
    permission_classes = [IsAdminUser]  # 🔒 seulement admin

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()

            return Response({
                "message": "Statut modifié",
                "is_active": user.is_active
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable"}, status=404)