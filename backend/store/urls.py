from django.urls import path
from .views import ProductListView, ProductDetailView, OrderCreateView, MyOrdersView

urlpatterns = [
    path("products/", ProductListView.as_view()),
    path("products/<str:product_id>/", ProductDetailView.as_view()),
    path("orders/", OrderCreateView.as_view()),
    path("orders/mine/", MyOrdersView.as_view()),
]
