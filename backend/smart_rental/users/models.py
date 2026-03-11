from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('traveller', 'Traveller'),
        ('driver', 'Driver'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')