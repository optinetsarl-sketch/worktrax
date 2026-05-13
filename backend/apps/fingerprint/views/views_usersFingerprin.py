# from rest_framework import viewsets
# from ...Fingerprint.models import UserFingerprint
# from ..Serializers.users_Serializer import UserFingerprintSerializer

# class UserFingerprintViewSet(viewsets.ModelViewSet):
#     queryset = UserFingerprint.objects.all()
#     serializer_class = UserFingerprintSerializer

# from cherrypy import request

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import OuvrierFingerprint, UserFingerprint
from ..models import Worker
from ..models import User
from ..Serializers.Ouvrier_Serializer import OuvrierFaceRegisterSerializer
from ..utils import encode_face, verify_face


   


  
# class LoginFaceView(APIView):
#     def post(self, request):
#         serializer = FaceLoginSerializer(data=request.data)

#         if serializer.is_valid():
#             image = serializer.validated_data['image']
#             worker_id = serializer.validated_data.get('worker_id')
#             user_id = serializer.validated_data.get('user_id')

#             # 🔥 WORKER
#             if worker_id:
#                 try:
#                     obj = OuvrierFingerprint.objects.get(worker_id=worker_id)
#                 except OuvrierFingerprint.DoesNotExist:
#                     return Response({"error": "Aucun visage enregistré"}, status=404)

#                 is_valid = verify_face(obj.face_encoding, image)

#                 if is_valid:
#                     return Response({"message": "Accès autorisé (ouvrier)"})
#                 else:
#                     return Response({"error": "Visage non reconnu"}, status=401)

#             # 🔥 USER
#             elif user_id:
#                 try:
#                     obj = UserFingerprint.objects.get(user_id=user_id)
#                 except UserFingerprint.DoesNotExist:
#                     return Response({"error": "Aucun visage enregistré"}, status=404)

#                 is_valid = verify_face(obj.face_encoding, image)

#                 if is_valid:
#                     return Response({"message": "Accès autorisé (user)"})
#                 else:
#                     return Response({"error": "Visage non reconnu"}, status=401)

#             return Response({"error": "ID requis"}, status=400)

#         return Response(serializer.errors, status=400)    