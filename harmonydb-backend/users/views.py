from django.contrib.auth import get_user_model
from rest_framework import status, generics, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.conf import settings
from django.db.models import Q

from .serializers import (
    RegisterSerializer, LoginSerializer, MeSerializer, UserSerializer,
    ResendVerificationSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    ChangePasswordSerializer
)
from .tokens import email_verification_token, password_reset_token
from .utils import encode_uid, decode_uid
from .emails import send_email_verification, send_password_reset
from .permissions import IsEmailVerified

User = get_user_model()

def jwt_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.validated_data["user"]
        tokens = jwt_for_user(user)
        return Response({"tokens": tokens, "user": MeSerializer(user).data}, status=200)

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_object(self):
        return self.request.user

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        uidb64 = request.query_params.get("uid")
        token = request.query_params.get("token")
        user = decode_uid(uidb64)
        if user and email_verification_token.check_token(user, token):
            user.email_verified = True
            user.save(update_fields=["email_verified"])
            return Response({"detail": "Email verified successfully."}, 200)
        return Response({"detail": "Invalid or expired token."}, 400)

class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = ResendVerificationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=ser.validated_data["email"])
        except User.DoesNotExist:
            # For privacy, return success anyway
            return Response({"detail": "If an account exists, a verification email has been sent."}, 200)
        uid = encode_uid(user.pk)
        token = email_verification_token.make_token(user)
        link = f'{settings.FRONTEND_BASE_URL}/verify-email?uid={uid}&token={token}'
        send_email_verification(user.email, link)
        return Response({"detail": "Verification email sent."}, 200)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = ForgotPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account exists, password reset was sent."}, 200)
        uid = encode_uid(user.pk)
        token = password_reset_token.make_token(user)
        link = f'{settings.FRONTEND_BASE_URL}/reset-password?uid={uid}&token={token}'
        send_password_reset(email, link)
        return Response({"detail": "If an account exists, password reset was sent."}, 200)

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = decode_uid(ser.validated_data["uid"])
        token = ser.validated_data["token"]
        if not user or not password_reset_token.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, 400)
        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password reset successfully."}, 200)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            # Also blacklist all outstanding tokens for this user
            tokens = OutstandingToken.objects.filter(user=request.user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Logout failed."}, status=status.HTTP_400_BAD_REQUEST)

# Example of a protected view that requires verified email
class VerifiedOnlyView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmailVerified]
    def get(self, request):
        return Response({"detail": "You are verified and authenticated."}, 200)

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = User.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(stage_name__icontains=search) |
                Q(email__icontains=search)
            )
        return queryset

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
