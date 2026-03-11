from rest_framework import serializers  # pyright: ignore[reportMissingImports]
from .models import Property, PropertyInquiry


class PropertySerializer(serializers.ModelSerializer):
    driver_username = serializers.CharField(source='driver.username', read_only=True)
    driver_name = serializers.SerializerMethodField()
    driver_profile_photo = serializers.ImageField(source='driver.profile_photo', read_only=True)
    booked_passengers_count = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()
    booked_passengers = serializers.SerializerMethodField()
    pending_requests_count = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()

    def get_driver_name(self, obj):
        full_name = f"{obj.driver.first_name} {obj.driver.last_name}".strip()
        return full_name or obj.driver.username

    def get_booked_passengers_count(self, obj):
        total = 0
        for booking in obj.bookings.filter(status__in=['approved', 'confirmed']):
            total += booking.passenger_count
        return total

    def get_seats_left(self, obj):
        return max(obj.max_passengers - self.get_booked_passengers_count(obj), 0)

    def get_booked_passengers(self, obj):
        passengers = []
        for booking in obj.bookings.filter(status__in=['approved', 'confirmed']).select_related('user'):
            passengers.append(
                {
                    'username': booking.user.username,
                    'name': f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username,
                    'passenger_count': booking.passenger_count,
                }
            )
        return passengers

    def get_pending_requests_count(self, obj):
        return obj.bookings.filter(status='pending').count()

    def get_pending_requests(self, obj):
        requests = []
        for booking in obj.bookings.filter(status='pending').select_related('user'):
            requests.append(
                {
                    'id': booking.id,
                    'username': booking.user.username,
                    'name': f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username,
                    'passenger_count': booking.passenger_count,
                    'status': booking.status,
                }
            )
        return requests

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('driver',)


class PropertyInquirySerializer(serializers.ModelSerializer):
    traveller_username = serializers.CharField(source='tenant.username', read_only=True)

    class Meta:
        model = PropertyInquiry
        fields = (
            'id',
            'property',
            'tenant',
            'traveller_username',
            'message',
            'move_in_date',
            'status',
            'created_at',
        )
        read_only_fields = ('tenant', 'traveller_username', 'created_at')