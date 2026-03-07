from rest_framework import serializers  # pyright: ignore[reportMissingImports]
from .models import Property, PropertyInquiry


class PropertySerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    inquiry_count = serializers.IntegerField(source='inquiries.count', read_only=True)

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('owner',)


class PropertyInquirySerializer(serializers.ModelSerializer):
    tenant_username = serializers.CharField(source='tenant.username', read_only=True)

    class Meta:
        model = PropertyInquiry
        fields = (
            'id',
            'property',
            'tenant',
            'tenant_username',
            'message',
            'move_in_date',
            'status',
            'created_at',
        )
        read_only_fields = ('tenant', 'tenant_username', 'created_at')