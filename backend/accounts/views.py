from bson import ObjectId
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from bazaarly.db import get_db
from .jwt_utils import make_token, get_user_from_request


class RegisterView(APIView):
    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not name or not email or not password:
            return Response(
                {"error": "name, email and password are all required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 6:
            return Response(
                {"error": "password must be at least 6 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        db = get_db()

        if db.users.find_one({"email": email}):
            return Response(
                {"error": "an account with this email already exists"},
                status=status.HTTP_409_CONFLICT
            )

        # Create user
        user_doc = {
            "name": name,
            "email": email,
            "password": make_password(password),
        }

        result = db.users.insert_one(user_doc)

        # Send welcome email
        send_mail(
            subject="Welcome to Bazaarly 🛍️",
            message=f"""
Hello {name},

Welcome to Bazaarly!

Your account has been created successfully.

Thanks for joining us.

— Bazaarly Team
""",
            from_email=None,
            recipient_list=[email],
            fail_silently=False,
        )

        # Create JWT token
        token = make_token(result.inserted_id, email)

        return Response(
            {
                "token": token,
                "user": {
                    "id": str(result.inserted_id),
                    "name": name,
                    "email": email,
                },
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        db = get_db()

        user = db.users.find_one({"email": email})

        if not user or not check_password(password, user["password"]):
            return Response(
                {"error": "invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = make_token(user["_id"], email)

        return Response({
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
            },
        })


class MeView(APIView):
    def get(self, request):
        payload = get_user_from_request(request)

        if not payload:
            return Response(
                {"error": "not authenticated"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        db = get_db()

        user = db.users.find_one(
            {"_id": ObjectId(payload["user_id"])}
        )

        if not user:
            return Response(
                {"error": "user not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        })