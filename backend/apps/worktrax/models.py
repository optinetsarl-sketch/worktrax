from django.db import models
from apps.users.models import User

### TABLE DES OUVRIERS ### 
class Worker(models.Model):
    GENDER = (
        ("M", "Masculin"),
        ("F", "Feminin"),
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, choices=GENDER)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    national_id = models.CharField(
        max_length=100,
        unique=True
    )
    salary_per_day = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    
### TABLE DES CHANTIERS  ###
class Site(models.Model):
    STATUS = (
        ("active", "Actif"),
        ("completed", "Terminé"),
        ("paused", "Suspendu"),
    )
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="active"
    )
    def __str__(self):
        return self.name
    

####  TABLE DES MACHINES  ###
class Machine(models.Model):
    STATUS = (
        ("available", "Disponible"),
        ("maintenance", "Maintenance"),
        ("assigned", "Affecté"),
    )
    name = models.CharField(max_length=255)
    serial_number = models.CharField(
        max_length=255,
        unique=True
    )
    plate_number = models.CharField(
        max_length=20,
        unique=True
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    purchase_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="available"
    )
    def __str__(self):
        return self.name


#### TABLE D'AFFECTATION DES OUVRIERS AUX CHANTIERS ####
class WorkerAssignment(models.Model):
    worker = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE
    )
    site = models.ForeignKey(
        Site,
        on_delete=models.CASCADE
    )
    start_date = models.DateField()
    end_date = models.DateField(
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)
    class Meta:
        unique_together = ("worker", "site")


#### AFFECTATION DES ENGINS ####
class MachineAssignment(models.Model):
    machine = models.ForeignKey(
        Machine,
        on_delete=models.CASCADE
    )
    site = models.ForeignKey(
        Site,
        on_delete=models.CASCADE
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True
    )
    returned_at = models.DateTimeField(
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)        

###  TABLE DE POINTAGE ###
class Attendance(models.Model):
    STATUS = (
        ("present", "Présent"),
        ("absent", "Absent"),
        ("late", "Retard"),
    )
    worker = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE
    )
    site = models.ForeignKey(
        Site,
        on_delete=models.CASCADE
    )
    checked_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="present"
    )
    fingerprint_verified = models.BooleanField(
        default=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    class Meta:
        unique_together = (
            "worker",
            "site",
            "check_in"
        )

###  TABLE DES PAIEMENTS  ###
class Payroll(models.Model):
    STATUS = (
        ("pending", "En attente"),
        ("paid", "Payé"),
    )
    worker = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE
    )
    month = models.IntegerField()

    year = models.IntegerField()

    days_worked = models.IntegerField()

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="pending"
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )