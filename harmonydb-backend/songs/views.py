from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse
from rest_framework import generics, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Song
from .serializers import SongSerializer
import os

# ---------- Upload ----------
class SongUploadView(generics.CreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("audio_file")
        if not file:
            return Response({"error": "Audio file required"}, status=400)
        song = Song.objects.create(
            title=request.data.get("title"),
            artist=request.user,
            audio_file=file,
        )
        return Response(SongSerializer(song, context={"request": request}).data)

# ---------- List ----------
class SongListView(generics.ListAPIView):
    serializer_class = SongSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Song.objects.all().order_by("-id")

# ---------- Stream (Range requests) ----------
class SongStreamView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        song = get_object_or_404(Song, pk=pk)
        file_path = song.audio_file.path
        file_size = os.path.getsize(file_path)
        range_header = request.headers.get("Range", "").strip()
        range_match = None
        if range_header.startswith("bytes="):
            range_match = range_header.replace("bytes=", "").split("-")
        chunk_size = 8192

        with open(file_path, "rb") as f:
            if range_match:
                start = int(range_match[0])
                end = int(range_match[1]) if range_match[1] else file_size - 1
                f.seek(start)
                data = f.read(end - start + 1)
                resp = HttpResponse(data, status=206, content_type="audio/mpeg")
                resp["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            else:
                resp = FileResponse(f, content_type="audio/mpeg")
                resp["Content-Length"] = file_size
        song.play_count += 1
        song.save(update_fields=["play_count"])
        return resp
