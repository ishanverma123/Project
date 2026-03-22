from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    traveller_username = serializers.CharField(source='user.username', read_only=True)
    ride_title = serializers.CharField(source='property.title', read_only=True)
    driver_id = serializers.IntegerField(source='property.driver.id', read_only=True)
    driver_name = serializers.SerializerMethodField()
    driver_profile_photo = serializers.ImageField(source='property.driver.profile_photo', read_only=True)
    negotiation_events = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user',)

    def validate_requested_bid_per_seat(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('Bid price must be greater than 0.')
        return value

    def validate_driver_counter_offer_per_seat(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('Counter-offer price must be greater than 0.')
        return value

    def get_driver_name(self, obj):
        full_name = f"{obj.property.driver.first_name} {obj.property.driver.last_name}".strip()
        return full_name or obj.property.driver.username

    def get_negotiation_events(self, obj):
        events = obj.negotiation_events.select_related('actor').all()
        return [
            {
                'id': event.id,
                'event_type': event.event_type,
                'message': event.message,
                'actor_id': event.actor_id,
                'actor_username': event.actor.username,
                'metadata': event.metadata,
                'created_at': event.created_at,
            }
            for event in events
        ]