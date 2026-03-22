from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.viewsets import ModelViewSet

from .models import Booking, BookingNegotiationEvent
from .serializers import BookingSerializer
from rental_core_engine.pricing_engine import PricingEngine


pricing_engine = PricingEngine()


class BookingViewSet(ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related('property', 'user').prefetch_related('negotiation_events__actor').all()
        if hasattr(user, 'role') and user.role == 'driver':
            return qs.filter(property__driver=user)
        return qs.filter(user=user)

    def _log_event(self, booking, actor, event_type, message, metadata=None):
        BookingNegotiationEvent.objects.create(
            booking=booking,
            actor=actor,
            event_type=event_type,
            message=message,
            metadata=metadata or {},
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status=Booking.STATUS_PENDING)

    def perform_update(self, serializer):
        booking = self.get_object()
        user = self.request.user
        new_status = serializer.validated_data.get('status')

        is_driver_owner = hasattr(user, 'role') and user.role == 'driver' and booking.property.driver == user
        is_traveller_owner = booking.user == user

        if is_driver_owner:
            self._update_by_driver(serializer, booking, new_status)
            return

        if is_traveller_owner:
            self._update_by_traveller(serializer, booking, new_status)
            return

        raise PermissionDenied('You are not allowed to update this booking.')

    def _update_by_driver(self, serializer, booking, new_status):
        if new_status not in {Booking.STATUS_APPROVED, Booking.STATUS_REJECTED, Booking.STATUS_COUNTERED}:
            raise ValidationError({'status': ['Status must be approved, rejected, or countered.']})

        if new_status == Booking.STATUS_APPROVED:
            approved = booking.property.bookings.filter(status__in=[Booking.STATUS_APPROVED, Booking.STATUS_CONFIRMED]).exclude(id=booking.id)
            used_seats = sum(item.passenger_count for item in approved)
            seats_left = booking.property.max_passengers - used_seats
            if booking.passenger_count > seats_left:
                raise ValidationError({'status': [f'Cannot approve: only {max(seats_left, 0)} seats left.']})

        if new_status == Booking.STATUS_COUNTERED:
            counter_offer = serializer.validated_data.get('driver_counter_offer_per_seat')
            if counter_offer is None:
                raise ValidationError({'driver_counter_offer_per_seat': ['Counter-offer is required when status is countered.']})

        updated = serializer.save()
        if new_status == Booking.STATUS_COUNTERED:
            self._log_event(
                updated,
                self.request.user,
                BookingNegotiationEvent.EVENT_DRIVER_COUNTERED,
                f"Driver proposed a counter-offer of ${updated.driver_counter_offer_per_seat} per seat.",
                {'driver_counter_offer_per_seat': str(updated.driver_counter_offer_per_seat)},
            )
        elif new_status == Booking.STATUS_APPROVED:
            self._log_event(
                updated,
                self.request.user,
                BookingNegotiationEvent.EVENT_DRIVER_APPROVED,
                'Driver approved this booking request.',
            )
        elif new_status == Booking.STATUS_REJECTED:
            self._log_event(
                updated,
                self.request.user,
                BookingNegotiationEvent.EVENT_DRIVER_REJECTED,
                'Driver rejected this booking request.',
            )

    def _update_by_traveller(self, serializer, booking, new_status):
        if new_status == Booking.STATUS_APPROVED:
            if booking.status != Booking.STATUS_COUNTERED or booking.driver_counter_offer_per_seat is None:
                raise ValidationError({'status': ['You can only accept a valid driver counter-offer.']})

            updated = serializer.save(
                status=Booking.STATUS_APPROVED,
                requested_bid_per_seat=booking.driver_counter_offer_per_seat,
            )
            self._log_event(
                updated,
                self.request.user,
                BookingNegotiationEvent.EVENT_TRAVELLER_ACCEPTED_COUNTER,
                f"Traveller accepted the driver counter-offer of ${updated.driver_counter_offer_per_seat} per seat.",
                {'agreed_price_per_seat': str(updated.driver_counter_offer_per_seat)},
            )
            return

        if new_status and new_status != Booking.STATUS_PENDING:
            raise ValidationError({'status': ['Traveller can only submit back to pending status or accept a counter-offer.']})

        # Traveller can negotiate only while waiting or after driver countered.
        if booking.status not in {Booking.STATUS_PENDING, Booking.STATUS_COUNTERED}:
            raise ValidationError({'detail': 'This booking is no longer open for negotiation.'})

        next_bid = serializer.validated_data.get('requested_bid_per_seat')
        if next_bid is None:
            raise ValidationError({'requested_bid_per_seat': ['Provide a bid to negotiate with the driver.']})

        updated = serializer.save(status=Booking.STATUS_PENDING)
        self._log_event(
            updated,
            self.request.user,
            BookingNegotiationEvent.EVENT_TRAVELLER_COUNTERED,
            f"Traveller submitted a new bid of ${updated.requested_bid_per_seat} per seat.",
            {'requested_bid_per_seat': str(updated.requested_bid_per_seat)},
        )

    def create(self, request, *args, **kwargs):
        user = request.user
        if hasattr(user, 'role') and user.role != 'traveller':
            raise PermissionDenied('Only travellers can book seats.')

        property_id = request.data.get('property')
        if not property_id:
            raise ValidationError({'property': ['Ride id is required.']})

        try:
            passenger_count = int(request.data.get('passenger_count', 1))
        except (TypeError, ValueError):
            raise ValidationError({'passenger_count': ['Passenger count must be a number.']})

        if passenger_count <= 0:
            raise ValidationError({'passenger_count': ['Passenger count must be at least 1.']})

        bid_raw = request.data.get('requested_bid_per_seat')
        requested_bid = None
        if bid_raw not in [None, '']:
            try:
                requested_bid = float(bid_raw)
            except (TypeError, ValueError):
                raise ValidationError({'requested_bid_per_seat': ['Bid must be a valid number.']})

            if requested_bid <= 0:
                raise ValidationError({'requested_bid_per_seat': ['Bid must be greater than 0.']})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ride = serializer.validated_data['property']

        existing_active = Booking.objects.filter(
            user=user,
            property=ride,
            status__in=['pending', 'approved', 'confirmed'],
        ).exists()
        if existing_active:
            raise ValidationError({'detail': 'You have already requested this ride.'})

        confirmed = ride.bookings.filter(status__in=['approved', 'confirmed'])
        booked_seats = sum(item.passenger_count for item in confirmed)
        seats_left = max(ride.max_passengers - booked_seats, 0)

        if seats_left <= 0:
            raise ValidationError({'passenger_count': ['This ride is full.']})

        if passenger_count > seats_left:
            raise ValidationError({'passenger_count': [f'Only {seats_left} seats left for this ride.']})

        suggestion = pricing_engine.suggest_price_per_seat(
            listed_price_per_seat=ride.price_per_seat,
            departure_time=ride.departure_time,
            seats_left=seats_left,
            max_passengers=ride.max_passengers,
            distance_km=ride.distance_km,
            duration_min=ride.estimated_duration_min,
            rider_booking_count=user.ride_bookings.filter(status__in=['approved', 'confirmed']).count(),
            eco_eligible=any(
                token in (ride.car_make or '').lower() or token in (ride.car_model or '').lower()
                for token in ['electric', 'ev', 'hybrid']
            ),
        )

        created_booking = serializer.save(
            user=user,
            status=Booking.STATUS_PENDING,
            listed_price_per_seat=ride.price_per_seat,
            platform_suggested_price_per_seat=suggestion['suggested_price_per_seat'],
            requested_bid_per_seat=requested_bid,
            pricing_breakdown=suggestion['breakdown'],
        )
        initial_message = 'Traveller requested booking.'
        if requested_bid is not None:
            initial_message += f' Initial bid: ${requested_bid} per seat.'
        self._log_event(
            created_booking,
            user,
            BookingNegotiationEvent.EVENT_BOOKING_REQUESTED,
            initial_message,
            {
                'listed_price_per_seat': str(ride.price_per_seat),
                'platform_suggested_price_per_seat': suggestion['suggested_price_per_seat'],
                'requested_bid_per_seat': requested_bid,
            },
        )
        headers = self.get_success_headers(serializer.data)
        data = dict(serializer.data)
        data['seats_left_after_booking'] = seats_left
        data['fare_comparison'] = {
            'listed_price_per_seat': suggestion['listed_price_per_seat'],
            'platform_suggested_price_per_seat': suggestion['suggested_price_per_seat'],
            'difference': suggestion['difference'],
            'comparison': suggestion['comparison'],
        }
        data['detail'] = 'Booking request sent to driver. Bid/price negotiation is now available.'
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)