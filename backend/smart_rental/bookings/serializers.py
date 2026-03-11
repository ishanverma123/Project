from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user',)
    traveller_username = serializers.CharField(source='user.username', read_only=True)
    ride_title = serializers.CharField(source='property.title', read_only=True)