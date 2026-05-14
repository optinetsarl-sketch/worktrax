# apps/users/views/login_view.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

class LoginView(APIView):
    permission_classes = []
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        role = request.data.get("role")
        user = authenticate(
            username=username,
            password=password
        )
        if user is None:
            return Response(
                {"error": "Identifiants invalides"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
        })
    



class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Déconnexion réussie"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Token invalide"}, status=status.HTTP_400_BAD_REQUEST)    