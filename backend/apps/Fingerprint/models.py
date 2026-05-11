from django.db import models
from apps.worktrax.models import Worker


##### Pour enregistrer les EMPREINTES DIGITALES des Ouvriere #####

class Fingerprint(models.Model):
    worker = models.OneToOneField(
        Worker,
        on_delete=models.CASCADE
    )
    fingerprint_template = models.BinaryField()
    created_at = models.DateTimeField(
        auto_now_add=True
    )