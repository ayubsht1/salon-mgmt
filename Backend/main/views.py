import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError, AccessToken
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
User = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            first_error_msg = "Validation failed"
            if serializer.errors:
                first_field = next(iter(serializer.errors))
                error_list = serializer.errors[first_field]
                if error_list and isinstance(error_list, list):
                    first_error_msg = str(error_list[0])
                elif isinstance(error_list, dict):
                    nested_field = next(iter(error_list))
                    first_error_msg = str(error_list[nested_field][0])

            return Response(
                {
                    "success": False,
                    "message": first_error_msg,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "User registered successfully.",
            },
            status=status.HTTP_201_CREATED,
        )

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"success": False, "message": "Email and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, email=email, password=password)

        if user is None:
            return Response(
                {"success": False, "message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "message": "Login successful",
                "data": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "middle_name": user.middle_name,
                        "last_name": user.last_name,
                        "is_staff": user.is_staff,
                    }
                },
            }
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"success": True, "message": "Logout successful."},
            )

        except TokenError:
            return Response(
                {"success": False, "message": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

class TokenRefreshView(APIView):
    """
    Takes a valid refresh type JSON web token and returns a fresh, 
    short-lived access token to continue hitting authenticated routes.
    """
    def post(self, request):
        refresh_token = request.data.get("refresh")
        
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            
            data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
            
            return Response(
                {
                    "success": True,
                    "message": "Token refreshed successfully.",
                    "data": data,
                },
            )

        except TokenError:
            return Response(
                {"success": False, "message": "Token is invalid or has expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

class VerifyTokenView(APIView):
    """
    Fast, memory-only access token verification.
    """
    def post(self, request):
        token_str = request.data.get("token")
        
        if not token_str:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token_str = auth_header.split(" ")[1]

        if not token_str:
            return Response(
                {"success": False, "message": "Access token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            AccessToken(token_str)

            return Response(
                {
                    "success": True,
                    "message": "Token is valid.",
                    "data": {"is_valid": True},
                }
            )

        except TokenError:
            return Response(
                {
                    "success": False,
                    "message": "Token is invalid or expired.",
                    "data": {"is_valid": False},
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )