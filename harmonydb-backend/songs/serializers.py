from rest_framework import serializers
from .models import Song, Album, Genre, Playlist, PlaylistSong, Favorite, ListeningHistory, Comment, AIPrompt, AIInteraction

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'description']

class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.display_name", read_only=True)
    songs_count = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = ['id', 'title', 'artist', 'artist_name', 'cover_image', 'release_date', 'created_at', 'updated_at', 'songs_count']
        read_only_fields = ['artist']

    def get_songs_count(self, obj):
        return obj.songs.count()

    def create(self, validated_data):
        validated_data['artist'] = self.context['request'].user
        return super().create(validated_data)

class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.display_name", read_only=True)
    album_title = serializers.CharField(source="album.title", read_only=True)
    genre_name = serializers.CharField(source="genre.name", read_only=True)
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            'id', 'title', 'artist', 'artist_name', 'album', 'album_title', 
            'genre', 'genre_name', 'cover_image', 'audio_file', 'audio_url',
            'release_date', 'duration', 'play_count', 'upload_date', 'approved'
        ]
        read_only_fields = ['artist', 'play_count', 'upload_date']

    def get_audio_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/api/songs/stream/{obj.id}/")
        return None

    def create(self, validated_data):
        validated_data['artist'] = self.context['request'].user
        return super().create(validated_data)

class PlaylistSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    song_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = PlaylistSong
        fields = ['id', 'song', 'song_id', 'added_at', 'order']

class PlaylistSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.display_name", read_only=True)
    songs = PlaylistSongSerializer(source="playlist_songs", many=True, read_only=True)
    songs_count = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            'id', 'name', 'user', 'user_name', 'cover_image', 'is_public', 
            'created_at', 'updated_at', 'songs', 'songs_count'
        ]
        read_only_fields = ['user']

    def get_songs_count(self, obj):
        return obj.playlist_songs.count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'item_type', 'item_id', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ListeningHistorySerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = ListeningHistory
        fields = ['id', 'user', 'song', 'listened_at']
        read_only_fields = ['user']

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_name', 'item_type', 'item_id', 'content', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class AIInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInteraction
        fields = ['id', 'message_type', 'message_text', 'timestamp']

class AIPromptSerializer(serializers.ModelSerializer):
    interactions = AIInteractionSerializer(many=True, read_only=True)

    class Meta:
        model = AIPrompt
        fields = [
            'id', 'user', 'prompt_text', 'response_text', 'generated_sql', 
            'executed_result', 'created_at', 'interactions'
        ]
        read_only_fields = ['user', 'response_text', 'generated_sql', 'executed_result']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
