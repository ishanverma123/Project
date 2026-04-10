from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rental_core_engine.notification_engine import NotificationEngine

from .models import CustomUser
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, UserUpdateSerializer


notification_engine = NotificationEngine()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        notification_engine.notify_user(
            user,
            subject='Welcome to Smart Carpool',
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                "Your account was created successfully.\n"
                "You can now search rides, publish rides, and manage bookings.\n\n"
                "- Smart Carpool"
            ),
        )
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
        notification_engine.notify_user(
            user,
            subject='Sign-in detected on your Smart Carpool account',
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                "We detected a new sign-in to your account.\n"
                f"IP Address: {ip_address}\n\n"
                "If this was not you, please reset your password immediately.\n\n"
                "- Smart Carpool"
            ),
        )
        return Response(UserSerializer(user).data)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request):
        return Response({"detail": "CSRF cookie set"}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request: Request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class PublicUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, user_id: int):
        user = get_object_or_404(CustomUser, id=user_id)
        return Response(UserSerializer(user).data)
