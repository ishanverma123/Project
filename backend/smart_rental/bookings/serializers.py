from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user',)
    traveller_username = serializers.CharField(source='user.username', read_only=True)
    ride_title = serializers.CharField(source='property.title', read_only=True)
    driver_id = serializers.IntegerField(source='property.driver.id', read_only=True)
    driver_name = serializers.SerializerMethodField()
    driver_profile_photo = serializers.ImageField(source='property.driver.profile_photo', read_only=True)

    def get_driver_name(self, obj):
        full_name = f"{obj.property.driver.first_name} {obj.property.driver.last_name}".strip()
        return full_name or obj.property.driver.username