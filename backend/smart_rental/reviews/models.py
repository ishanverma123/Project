from django.db import models
from django.conf import settings
from properties.models import Property

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()