from django.db import models
from django.conf import settings
from properties.models import Property


class Booking(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_COUNTERED = 'countered'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CONFIRMED = 'confirmed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COUNTERED, 'Countered'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_CONFIRMED, 'Confirmed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='ride_bookings', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='bookings', on_delete=models.CASCADE)
    passenger_count = models.PositiveSmallIntegerField(default=1)
    listed_price_per_seat = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    platform_suggested_price_per_seat = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    requested_bid_per_seat = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    driver_counter_offer_per_seat = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    pricing_breakdown = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)


class BookingNegotiationEvent(models.Model):
    EVENT_BOOKING_REQUESTED = 'booking_requested'
    EVENT_DRIVER_COUNTERED = 'driver_countered'
    EVENT_DRIVER_APPROVED = 'driver_approved'
    EVENT_DRIVER_REJECTED = 'driver_rejected'
    EVENT_TRAVELLER_COUNTERED = 'traveller_countered'
    EVENT_TRAVELLER_ACCEPTED_COUNTER = 'traveller_accepted_counter'

    EVENT_CHOICES = [
        (EVENT_BOOKING_REQUESTED, 'Booking Requested'),
        (EVENT_DRIVER_COUNTERED, 'Driver Countered'),
        (EVENT_DRIVER_APPROVED, 'Driver Approved'),
        (EVENT_DRIVER_REJECTED, 'Driver Rejected'),
        (EVENT_TRAVELLER_COUNTERED, 'Traveller Countered'),
        (EVENT_TRAVELLER_ACCEPTED_COUNTER, 'Traveller Accepted Counter'),
    ]

    booking = models.ForeignKey(Booking, related_name='negotiation_events', on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='booking_events', on_delete=models.CASCADE)
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES)
    message = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']