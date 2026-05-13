from django.db import models

# Create your models here.
from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class Role(models.Model):

    ROLE_TYPES = (
        ("Administrateur", "Administrateur"),
        ("RH", "RH"),
        ("Superviseur", "Superviseur"),
        ("Contrôleur", "Contrôleur"),
        ("Pompiste", "Pompiste"),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50,choices=ROLE_TYPES,unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.code
    

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        related_name="users"
    )
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.username 
    def is_super_admin(self):
        return self.role and self.role.name == "super_admin"   
    

### Permission par TABLE ###
class Permission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    table_name = models.CharField(max_length=100)

    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

### Permission par colonne ###
class ColumnPermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    table_name = models.CharField(max_length=100)
    column_name = models.CharField(max_length=100)

    can_view = models.BooleanField(default=True)        