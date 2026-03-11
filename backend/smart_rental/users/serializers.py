from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation (e.g. for /me)."""

    rides_listed_count = serializers.SerializerMethodField()
    rides_booked_count = serializers.SerializerMethodField()

    def get_rides_listed_count(self, obj):
        return obj.property_set.count()

    def get_rides_booked_count(self, obj):
        return obj.ride_bookings.filter(status__in=["approved", "confirmed"]).count()

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "profile_photo",
            "bio",
            "phone",
            "rides_listed_count",
            "rides_booked_count",
        )
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            "email",
            "first_name",
            "last_name",
            "bio",
            "phone",
            "profile_photo",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "bio",
            "phone",
        )

    def validate_password(self, value: str) -> str:
        """
        Run Django's built-in password validators to enforce strength
        rules (length, common passwords, numeric-only, similarity, etc.).
        """
        validate_password(value)
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],  # hashed internally
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=validated_data["role"],
            bio=validated_data.get("bio", ""),
            phone=validated_data.get("phone", ""),
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        username_or_email = data["username"]
        password = data["password"]

        # First try to authenticate using the value as a username
        user = authenticate(
            request=self.context.get("request"),
            username=username_or_email,
            password=password,
        )

        # If that fails, try treating the value as an email
        if not user:
            try:
                user_obj = CustomUser.objects.get(email=username_or_email)
            except CustomUser.DoesNotExist:
                user_obj = None

            if user_obj:
                user = authenticate(
                    request=self.context.get("request"),
                    username=user_obj.username,
                    password=password,
                )

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        data["user"] = user
        return data
