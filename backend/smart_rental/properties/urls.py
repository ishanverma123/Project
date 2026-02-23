from django.urls import path
from .views import PropertyViewSet

property_list = PropertyViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

urlpatterns = [
    path("", property_list),
]