
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.models import Customer
from accounts.jwt_utils import get_user_from_request
from .models import Product, Order, OrderItem


def serialize_product(product):
    return {
        "id": str(product.pk),
        "name": product.name,
        "category": product.category,
        "emoji": product.emoji,
        "price": product.price,
        "mrp": product.mrp,
        "rating": product.rating,
        "reviews": product.reviews,
    }


class ProductListView(APIView):
    def get(self, request):
        products = Product.objects.all().order_by("id")

        category = request.query_params.get("category")
        if category and category != "All":
            products = products.filter(category=category)

        search = request.query_params.get("search")
        if search:
            products = products.filter(name__icontains=search)

        return Response([
            serialize_product(product)
            for product in products
        ])


class ProductDetailView(APIView):
    def get(self, request, product_id):
        if not product_id.isdigit():
            return Response(
                {"error": "invalid product id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = Product.objects.filter(pk=int(product_id)).first()

        if not product:
            return Response(
                {"error": "product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(serialize_product(product))


class OrderCreateView(APIView):
    def post(self, request):
        payload = get_user_from_request(request)

        if not payload:
            return Response(
                {"error": "please log in to place an order"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        customer = Customer.objects.filter(
            pk=payload.get("user_id")
        ).first()

        if not customer:
            return Response(
                {"error": "user not found"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        items = request.data.get("items") or []
        address = (request.data.get("address") or "").strip()

        if not isinstance(items, list) or not items:
            return Response(
                {"error": "cart is empty"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not address:
            return Response(
                {"error": "delivery address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_items = []
        subtotal = 0

        for item in items:
            if not isinstance(item, dict):
                continue

            product_id = str(item.get("product_id", ""))
            if not product_id.isdigit():
                continue

            try:
                qty = int(item.get("qty", 1))
            except (ValueError, TypeError):
                continue

            if qty < 1 or qty > 100:
                continue

            product = Product.objects.filter(
                pk=int(product_id)
            ).first()

            if not product:
                continue

            line_total = product.price * qty
            subtotal += line_total

            order_items.append({
                "product": product,
                "name": product.name,
                "price": product.price,
                "qty": qty,
                "line_total": line_total,
            })

        if not order_items:
            return Response(
                {"error": "no valid items in cart"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delivery = 0 if subtotal >= 499 else 49
        total = subtotal + delivery

        with transaction.atomic():
            order = Order.objects.create(
                customer=customer,
                user_email=customer.email,
                subtotal=subtotal,
                delivery=delivery,
                total=total,
                address=address,
                status="placed",
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    order=order,
                    product=item["product"],
                    product_name=item["name"],
                    price=item["price"],
                    qty=item["qty"],
                    line_total=item["line_total"],
                )
                for item in order_items
            ])

        return Response({
            "order_id": str(order.pk),
            "total": total,
            "status": order.status,
        }, status=status.HTTP_201_CREATED)


class MyOrdersView(APIView):
    def get(self, request):
        payload = get_user_from_request(request)

        if not payload:
            return Response(
                {"error": "please log in"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        orders = Order.objects.filter(
            customer_id=payload.get("user_id")
        ).prefetch_related("items").order_by("-created_at")

        result = []

        for order in orders:
            result.append({
                "id": str(order.pk),
                "user_id": str(order.customer_id),
                "user_email": order.user_email,
                "subtotal": order.subtotal,
                "delivery": order.delivery,
                "total": order.total,
                "address": order.address,
                "status": order.status,
                "items": [
                    {
                        "product_id": (
                            str(item.product_id)
                            if item.product_id else None
                        ),
                        "name": item.product_name,
                        "price": item.price,
                        "qty": item.qty,
                        "line_total": item.line_total,
                    }
                    for item in order.items.all()
                ],
            })

        return Response(result)
