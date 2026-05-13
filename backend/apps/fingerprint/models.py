# Create your models here.
from django.db import models
from apps.worktrax.models import Worker
from apps.users.models import User

##### Pour enregistrer les EMPREINTES DIGITALES des Ouvriere #####
class OuvrierFingerprint(models.Model):
    worker = models.OneToOneField(
        Worker,
        on_delete=models.CASCADE
    )
    # Encodage facial : Liste de 128 nombres stockée en JSON
    # face_encoding = models.JSONField(null=True, blank=True)
    face_encoding = models.BinaryField(null=True, blank=True)
    # fingerprint_template = models.BinaryField()
    # photo_reference = models.ImageField(upload_to='profiles/', null=True)
    created_at = models.DateTimeField(
        auto_now_add=True
    )


class UserFingerprint(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )
    # Encodage facial : Liste de 128 nombres stockée en JSON
    face_encoding = models.JSONField(null=True, blank=True)

    fingerprint_template = models.BinaryField()

    photo_reference = models.ImageField(upload_to='profiles/', null=True)
    created_at = models.DateTimeField(
        auto_now_add=True
    )
# import face_recognition
# import json
# from django.http import JsonResponse
# from .models import Ouvrier

# def enregistrer_visage(request, ouvrier_id):
#     if request.method == 'POST':
#         # On récupère l'image envoyée par la webcam (format base64 ou fichier)
#         file = request.FILES['image']
#         image = face_recognition.load_image_file(file)
        
#         # On génère l'encodage (la "signature" du visage)
#         encodings = face_recognition.face_encodings(image)
        
#         if encodings:
#             ouvrier = Ouvrier.objects.get(id=ouvrier_id)
#             ouvrier.face_encoding = encodings[0].tolist() # Convertit en liste pour le JSON
#             ouvrier.save()
#             return JsonResponse({'status': 'success'})
#     return JsonResponse({'status': 'error', 'message': 'Aucun visage détecté'})
