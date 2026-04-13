from django.db import models
from django.utils import timezone

class Flat(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    # agency commission percentage for this property (e.g. 10.00 = 10%)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class Room(models.Model):
    flat = models.ForeignKey(Flat, on_delete=models.CASCADE, related_name='rooms')
    name = models.CharField(max_length=255)
    max_capacity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} ({self.flat.name})"

class Bed(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Maintenance'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    # monthly rent for this specific bed
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} - {self.room.name}"

class Tenant(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='tenants/', null=True, blank=True)
    bed = models.OneToOneField(Bed, on_delete=models.SET_NULL, null=True, blank=True, related_name='tenant')
    joined_at = models.DateField(default=timezone.localdate)

    def __str__(self):
        return self.name
