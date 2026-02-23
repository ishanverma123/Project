from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Booking
from .serializers import BookingSerializer
from rental_core_engine.booking_engine import BookingEngine
from rental_core_engine.pricing_engine import PricingEngine

booking_engine = BookingEngine()
pricing_engine = PricingEngine()


class BookingViewSet(ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):

        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        if not booking_engine.validate_dates(start_date, end_date):
            return Response({"error": "Invalid dates"}, status=400)

        response = super().create(request, *args, **kwargs)

        booking = Booking.objects.get(id=response.data["id"])

        total_price = pricing_engine.calculate_total_price(
            booking.property.price_per_day,
            booking.start_date,
            booking.end_date
        )

        response.data["total_price"] = total_price

        return response