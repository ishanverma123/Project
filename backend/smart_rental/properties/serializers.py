from rest_framework import serializers  # pyright: ignore[reportMissingImports]
from .models import Property, PropertyInquiry
from rental_core_engine.pricing_engine import PricingEngine


pricing_engine = PricingEngine()


class PropertySerializer(serializers.ModelSerializer):
    driver_username = serializers.CharField(source='driver.username', read_only=True)
    driver_name = serializers.SerializerMethodField()
    driver_profile_photo = serializers.ImageField(source='driver.profile_photo', read_only=True)
    booked_passengers_count = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()
    booked_passengers = serializers.SerializerMethodField()
    pending_requests_count = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()
    platform_suggested_price_per_seat = serializers.SerializerMethodField()
    fare_comparison = serializers.SerializerMethodField()

    def _get_suggestion(self, obj):
        cache = self.context.setdefault('_fare_suggestion_cache', {})
        if obj.id in cache:
            return cache[obj.id]

        request = self.context.get('request')
        rider_booking_count = 0
        if request and request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'traveller':
            rider_booking_count = request.user.ride_bookings.filter(status__in=['approved', 'confirmed']).count()

        car_make_value = (obj.car_make or '').lower()
        car_model_value = (obj.car_model or '').lower()
        eco_eligible = any(token in car_make_value or token in car_model_value for token in ['electric', 'ev', 'hybrid'])

        suggestion = pricing_engine.suggest_price_per_seat(
            listed_price_per_seat=obj.price_per_seat,
            departure_time=obj.departure_time,
            seats_left=self.get_seats_left(obj),
            max_passengers=obj.max_passengers,
            distance_km=obj.distance_km,
            duration_min=obj.estimated_duration_min,
            rider_booking_count=rider_booking_count,
            eco_eligible=eco_eligible,
        )
        cache[obj.id] = suggestion
        return suggestion

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
                    'user_id': booking.user.id,
                    'username': booking.user.username,
                    'name': f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username,
                    'passenger_count': booking.passenger_count,
                    'profile_photo': booking.user.profile_photo.url if booking.user.profile_photo else None,
                }
            )
        return passengers

    def get_pending_requests_count(self, obj):
        return obj.bookings.filter(status__in=['pending', 'countered']).count()

    def get_pending_requests(self, obj):
        requests = []
        for booking in obj.bookings.filter(status__in=['pending', 'countered']).select_related('user'):
            requests.append(
                {
                    'id': booking.id,
                    'username': booking.user.username,
                    'name': f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username,
                    'passenger_count': booking.passenger_count,
                    'status': booking.status,
                    'listed_price_per_seat': booking.listed_price_per_seat,
                    'platform_suggested_price_per_seat': booking.platform_suggested_price_per_seat,
                    'requested_bid_per_seat': booking.requested_bid_per_seat,
                    'driver_counter_offer_per_seat': booking.driver_counter_offer_per_seat,
                }
            )
        return requests

    def get_platform_suggested_price_per_seat(self, obj):
        suggestion = self._get_suggestion(obj)
        return suggestion['suggested_price_per_seat']

    def get_fare_comparison(self, obj):
        suggestion = self._get_suggestion(obj)
        return {
            'comparison': suggestion['comparison'],
            'difference': suggestion['difference'],
            'demand_multiplier': suggestion['demand_multiplier'],
            'is_peak_hour': suggestion['is_peak_hour'],
            'breakdown': suggestion['breakdown'],
            'inputs': {
                'distance_km': obj.distance_km,
                'estimated_duration_min': obj.estimated_duration_min,
                'fuel_surcharge_per_km': suggestion.get('policy_applied', {}).get('fuel_surcharge_per_km', 0),
                'promo_discount_pct': suggestion.get('policy_applied', {}).get('promo_discount_pct', 0),
                'loyalty_discount_pct': suggestion.get('policy_applied', {}).get('loyalty_discount_pct', 0),
                'eco_incentive_pct': suggestion.get('policy_applied', {}).get('eco_incentive_pct', 0),
                'holiday_surcharge_pct': suggestion.get('policy_applied', {}).get('holiday_surcharge_pct', 0),
            },
            'policy_applied': suggestion.get('policy_applied', {}),
        }

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