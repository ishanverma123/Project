from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Property, PropertyInquiry
from .serializers import PropertyInquirySerializer, PropertySerializer


class PropertyViewSet(ModelViewSet):
    queryset = Property.objects.select_related('driver').all()
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset().order_by('departure_time')
        from_city = self.request.query_params.get('from_city')
        to_city = self.request.query_params.get('to_city')
        departure_date = self.request.query_params.get('departure_date')
        mine = self.request.query_params.get('mine')

        if from_city:
            qs = qs.filter(from_city__icontains=from_city)
        if to_city:
            qs = qs.filter(to_city__icontains=to_city)
        if departure_date:
            qs = qs.filter(departure_time__date=departure_date)
        if mine == 'true' and self.request.user.is_authenticated:
            qs = qs.filter(driver=self.request.user)
        return qs

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'role') or self.request.user.role != 'driver':
            raise PermissionDenied('Only drivers can create rides.')
        try:
            serializer.save(driver=self.request.user)
        except Exception as exc:
            raise ValidationError(
                {'image': [f'Property could not be created because image upload failed: {exc}']}
            ) from exc

    def _assert_ride_owner(self):
        ride = self.get_object()
        user = self.request.user
        if not hasattr(user, 'role') or user.role != 'driver' or ride.driver != user:
            raise PermissionDenied('You can only modify your own rides.')

    def perform_update(self, serializer):
        self._assert_ride_owner()
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_ride_owner()
        instance.delete()


class PropertyInquiryViewSet(ModelViewSet):
    queryset = PropertyInquiry.objects.select_related('property', 'tenant').all()
    serializer_class = PropertyInquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        property_id = self.request.query_params.get('property')

        # Travellers see only their own messages; drivers see ride messages.
        if hasattr(user, 'role') and user.role == 'driver':
            qs = qs.filter(property__driver=user)
        else:
            qs = qs.filter(tenant=user)

        if property_id:
            qs = qs.filter(property_id=property_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)

    def perform_update(self, serializer):
        inquiry = self.get_object()
        user = self.request.user
        if not hasattr(user, 'role') or user.role != 'driver' or inquiry.property.driver != user:
            raise PermissionDenied("You can only update inquiries for your own properties.")
        serializer.save()