from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.viewsets import ModelViewSet

from .models import Booking
from .serializers import BookingSerializer


class BookingViewSet(ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related('property', 'user').all()
        if hasattr(user, 'role') and user.role == 'driver':
            return qs.filter(property__driver=user)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='pending')

    def perform_update(self, serializer):
        booking = self.get_object()
        user = self.request.user

        # Drivers can only approve/reject requests for their own rides.
        if not hasattr(user, 'role') or user.role != 'driver' or booking.property.driver != user:
            raise PermissionDenied('Only the ride driver can update booking requests.')

        new_status = serializer.validated_data.get('status')
        if new_status not in {'approved', 'rejected'}:
            raise ValidationError({'status': ['Status must be approved or rejected.']})

        if new_status == 'approved':
            approved = booking.property.bookings.filter(status__in=['approved', 'confirmed']).exclude(id=booking.id)
            used_seats = sum(item.passenger_count for item in approved)
            seats_left = booking.property.max_passengers - used_seats
            if booking.passenger_count > seats_left:
                raise ValidationError({'status': [f'Cannot approve: only {max(seats_left, 0)} seats left.']})

        serializer.save()

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

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        data = dict(serializer.data)
        data['seats_left_after_booking'] = seats_left
        data['detail'] = 'Booking request sent to driver for approval.'
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)