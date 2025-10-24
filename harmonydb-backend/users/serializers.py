from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from .tokens import email_verification_token, password_reset_token
from .utils import encode_uid
from django.conf import settings

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices)

    class Meta:
        model = User
        fields = ("username", "email", "role", "password", "confirm_password")

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs

    def create(self, validated):
        validated.pop("confirm_password")
        password = validated.pop("password")
        user = User.objects.create(**validated)
        user.set_password(password)
        user.is_active = True  # allow login after verification (we’ll gate features by email_verified)
        user.save()
        # Build verification link
        uid = encode_uid(user.pk)
        token = email_verification_token.make_token(user)
        link = f'{settings.FRONTEND_BASE_URL}/verify-email?uid={uid}&token={token}'
        from .emails import send_email_verification
        send_email_verification(user.email, link)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        return {"user": user}

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "email_verified", "display_name", "profile_picture", "bio", "stage_name", "birth_date")
        read_only_fields = ("id", "email_verified", "display_name")

class MeSerializer(serializers.ModelSerializer):
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "email_verified", "display_name", "profile_picture", "bio", "stage_name", "birth_date")
        read_only_fields = ("id", "email_verified", "display_name")

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()
