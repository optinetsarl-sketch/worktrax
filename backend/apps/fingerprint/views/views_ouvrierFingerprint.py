from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import OuvrierFingerprint, UserFingerprint
from ..models import Worker
from ..models import User
from ..Serializers.Ouvrier_Serializer import OuvrierFaceRegisterSerializer
from ..utils import encode_face, verify_face


class OuvrierRegisterFaceView(APIView):
    def post(self, request):
        print("🔥 DATA REÇUE:", request.data)
        serializer = OuvrierFaceRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        worker_id = serializer.validated_data.get("worker_id")
        image = serializer.validated_data.get("image")
        worker = Worker.objects.get(id=worker_id)
        face_encoding = encode_face(image)
        if face_encoding is None:
            return Response({"error": "Aucun visage détecté"}, status=400)
        obj, created = OuvrierFingerprint.objects.get_or_create(worker=worker)
        obj.face_encoding = face_encoding
        obj.save()
        return Response({"message": "OK"})