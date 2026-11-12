
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
from django.core.mail import send_mail

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Customer
from .jwt_utils import make_token, get_user_from_request


class RegisterView(APIView):
    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        # Validate required fields
        if not name or not email or not password:
            return Response(
                {"error": "name, email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password length
        if len(password) < 6:
            return Response(
                {"error": "password must be at least 6 characters"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check whether account already exists
        if Customer.objects.filter(email=email).exists():
            return Response(
                {"error": "an account with this email already exists"},
                status=status.HTTP_409_CONFLICT,
            )

        # Create customer account
        user = Customer.objects.create(
            name=name,
            email=email,
            password=make_password(password),
        )

        # Send welcome email
        try:
            sent_count = send_mail(
                subject="Welcome to Bazaarly!",
                message=(
                    f"Hello {name},\n\n"
                    "Welcome to Bazaarly!\n"
                    "Your account has been created successfully.\n\n"
                    "You can now log in and start using Bazaarly.\n\n"
                    "Thanks for joining us!\n"
                    "Bazaarly Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            if sent_count == 1:
                print(f"Welcome email accepted for sending to {email}")
            else:
                print(f"Welcome email was not sent to {email}")

        except Exception as e:
            print(f"Welcome email failed: {type(e).__name__}: {e}")

        # Generate authentication token
        token = make_token(user.pk, email)

        # Return account details
        return Response(
            {
                "token": token,
                "user": {
                    "id": str(user.pk),
                    "name": user.name,
                    "email": user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        user = Customer.objects.filter(email=email).first()

        if not user or not check_password(password, user.password):
            return Response(
                {"error": "invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = make_token(user.pk, user.email)

        return Response(
            {
                "token": token,
                "user": {
                    "id": str(user.pk),
                    "name": user.name,
                    "email": user.email,
                },
            }
        )


class MeView(APIView):
    def get(self, request):
        payload = get_user_from_request(request)

        if not payload:
            return Response(
                {"error": "not authenticated"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = Customer.objects.filter(
            pk=payload.get("user_id")
        ).first()

        if not user:
            return Response(
                {"error": "user not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "id": str(user.pk),
                "name": user.name,
                "email": user.email,
            }
        )
