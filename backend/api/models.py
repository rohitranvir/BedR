from django.db import models

class Flat(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

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

    def __str__(self):
        return f"{self.name} - {self.room.name}"

class Tenant(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    bed = models.OneToOneField(Bed, on_delete=models.SET_NULL, null=True, blank=True, related_name='tenant')

    def __str__(self):
        return self.name
