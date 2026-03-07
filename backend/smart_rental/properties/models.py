from django.db import models
from django.conf import settings


class Property(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    price_per_day = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='properties/', blank=True, null=True)

    # Details shown on the property detail page
    address_line1 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    zip_code = models.CharField(max_length=20, blank=True, default="")
    beds = models.PositiveSmallIntegerField(default=1)
    baths = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    sqft = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)


class PropertyInquiry(models.Model):
    property = models.ForeignKey(Property, related_name='inquiries', on_delete=models.CASCADE)
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    move_in_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)