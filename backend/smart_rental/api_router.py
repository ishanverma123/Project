from django.urls import path
from rest_framework.routers import DefaultRouter

from properties.views import PropertyViewSet
from bookings.views import BookingViewSet
from users.views import CurrentUserView, LoginView, LogoutView, RegisterView

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/me/', CurrentUserView.as_view()),
] + router.urls