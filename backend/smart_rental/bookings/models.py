from django.db import models
from django.conf import settings
from properties.models import Property


class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='ride_bookings', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='bookings', on_delete=models.CASCADE)
    passenger_count = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)