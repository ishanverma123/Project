from django.urls import path
from rest_framework.routers import DefaultRouter

from properties.views import PropertyInquiryViewSet, PropertyViewSet
from bookings.views import BookingViewSet
from users.views import CurrentUserView, LoginView, LogoutView, PublicUserProfileView, RegisterView

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'property-inquiries', PropertyInquiryViewSet, basename='property-inquiry')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/me/', CurrentUserView.as_view()),
    path('users/public/<int:user_id>/', PublicUserProfileView.as_view()),
] + router.urls