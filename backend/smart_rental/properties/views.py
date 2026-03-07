from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied

from .models import Property, PropertyInquiry
from .serializers import PropertyInquirySerializer, PropertySerializer


class PropertyViewSet(ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PropertyInquiryViewSet(ModelViewSet):
    queryset = PropertyInquiry.objects.select_related('property', 'tenant').all()
    serializer_class = PropertyInquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        property_id = self.request.query_params.get('property')

        # Tenants see only their own inquiries; landlords see inquiries for
        # properties they own.
        if hasattr(user, 'role') and user.role == 'landlord':
            qs = qs.filter(property__owner=user)
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
        if not hasattr(user, 'role') or user.role != 'landlord' or inquiry.property.owner != user:
            raise PermissionDenied("You can only update inquiries for your own properties.")
        serializer.save()