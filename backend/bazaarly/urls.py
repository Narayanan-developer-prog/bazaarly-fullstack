from django.urls import path, include

urlpatterns = [
    path("api/", include("store.urls")),
    path("api/auth/", include("accounts.urls")),
]
