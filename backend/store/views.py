from bson import ObjectId
from bson.errors import InvalidId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from bazaarly.db import get_db
from accounts.jwt_utils import get_user_from_request


def serialize_product(p):
    return {
        "id": str(p["_id"]),
        "name": p["name"],
        "category": p["category"],
        "emoji": p.get("emoji", "📦"),
        "price": p["price"],
        "mrp": p["mrp"],
        "rating": p.get("rating", 0),
        "reviews": p.get("reviews", 0),
    }


class ProductListView(APIView):
    def get(self, request):
        db = get_db()
        query = {}

        category = request.query_params.get("category")
        if category and category != "All":
            query["category"] = category

        search = request.query_params.get("search")
        if search:
            query["name"] = {"$regex": search, "$options": "i"}

        products = list(db.products.find(query))
        return Response([serialize_product(p) for p in products])


class ProductDetailView(APIView):
    def get(self, request, product_id):
        db = get_db()
        try:
            product = db.products.find_one({"_id": ObjectId(product_id)})
        except InvalidId:
            return Response({"error": "invalid product id"}, status=status.HTTP_400_BAD_REQUEST)

        if not product:
            return Response({"error": "product not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_product(product))


class OrderCreateView(APIView):
    def post(self, request):
        payload = get_user_from_request(request)
        if not payload:
            return Response({"error": "please log in to place an order"},
                             status=status.HTTP_401_UNAUTHORIZED)

        items = request.data.get("items") or []
        address = (request.data.get("address") or "").strip()
        if not items:
            return Response({"error": "cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
        if not address:
            return Response({"error": "delivery address is required"}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()

        # Never trust prices sent from the frontend — look them up again server-side.
        order_items = []
        subtotal = 0
        for item in items:
            try:
                product = db.products.find_one({"_id": ObjectId(item.get("product_id"))})
            except (InvalidId, TypeError):
                product = None
            if not product:
                continue
            qty = max(1, int(item.get("qty", 1)))
            line_total = product["price"] * qty
            subtotal += line_total
            order_items.append({
                "product_id": str(product["_id"]),
                "name": product["name"],
                "price": product["price"],
                "qty": qty,
                "line_total": line_total,
            })

        if not order_items:
            return Response({"error": "no valid items in cart"}, status=status.HTTP_400_BAD_REQUEST)

        delivery = 0 if subtotal >= 499 else 49
        total = subtotal + delivery

        order_doc = {
            "user_id": payload["user_id"],
            "user_email": payload["email"],
            "items": order_items,
            "subtotal": subtotal,
            "delivery": delivery,
            "total": total,
            "address": address,
            "status": "placed",
        }
        result = db.orders.insert_one(order_doc)

        return Response({
            "order_id": str(result.inserted_id),
            "total": total,
            "status": "placed",
        }, status=status.HTTP_201_CREATED)


class MyOrdersView(APIView):
    def get(self, request):
        payload = get_user_from_request(request)
        if not payload:
            return Response({"error": "please log in"}, status=status.HTTP_401_UNAUTHORIZED)

        db = get_db()
        orders = list(db.orders.find({"user_id": payload["user_id"]}).sort("_id", -1))
        for o in orders:
            o["id"] = str(o.pop("_id"))
        return Response(orders)
