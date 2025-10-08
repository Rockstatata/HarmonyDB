from rest_framework import serializers
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.ReadOnlyField(source="artist.username")
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = ["id", "title", "artist_name", "genre", "cover_image", "audio_url", "play_count"]

    def get_audio_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/api/songs/stream/{obj.id}/")
        return None
