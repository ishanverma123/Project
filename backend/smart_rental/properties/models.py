from django.db import models
from django.conf import settings


class Property(models.Model):
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    pickup_point = models.CharField(max_length=255, blank=True, default="")
    dropoff_point = models.CharField(max_length=255, blank=True, default="")
    departure_time = models.DateTimeField()
    price_per_seat = models.DecimalField(max_digits=8, decimal_places=2)
    max_passengers = models.PositiveSmallIntegerField(default=1)

    distance_km = models.DecimalField(max_digits=7, decimal_places=2, default=12.0)
    estimated_duration_min = models.PositiveIntegerField(default=25)
    fuel_surcharge_per_km = models.DecimalField(max_digits=6, decimal_places=2, default=0.25)
    promo_discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    loyalty_discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    eco_incentive_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    holiday_surcharge_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    car_make = models.CharField(max_length=100, blank=True, default="")
    car_model = models.CharField(max_length=100, blank=True, default="")
    car_color = models.CharField(max_length=50, blank=True, default="")
    car_plate = models.CharField(max_length=50, blank=True, default="")
    image = models.ImageField(upload_to='cars/', blank=True, null=True)

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