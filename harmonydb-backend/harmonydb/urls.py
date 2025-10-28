"""
URL configuration for harmonydb project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/users/", include("users.urls_users")),
    path("api/songs/", include("songs.urls")),
    path("api/albums/", include("songs.urls_albums")),
    path("api/playlists/", include("songs.urls_playlists")),
    path("api/analytics/", include("songs.urls_analytics")),  # Advanced SQL Analytics
    path("api/ai/", include("meloai.urls")),  # Add AI endpoints
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
