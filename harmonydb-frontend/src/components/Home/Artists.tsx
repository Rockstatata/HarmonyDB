import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Play, Music, Disc, ExternalLink, Verified } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { User as Artist } from '../../types';

const Artists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('list');
  const { playSong } = usePlayer();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const allUsers = await apiService.getUsers();
        const artistUsers = allUsers.filter(user => user.role === 'artist');
        
        // Calculate actual song and album counts for each artist
        const artistsWithCounts = await Promise.all(
          artistUsers.map(async (artist) => {
            try {
              const [songs, albums] = await Promise.all([
                apiService.getSongs({ artist: artist.id.toString() }),
                apiService.getAlbums({ artist: artist.id.toString() })
              ]);
              
              return {
                ...artist,
                songs_count: songs.length,
                albums_count: albums.length
              };
            } catch (error) {
              console.error(`Error fetching counts for artist ${artist.id}:`, error);
              return {
                ...artist,
                songs_count: 0,
                albums_count: 0
              };
            }
          })
        );
        
        setArtists(artistsWithCounts);
      } catch (error) {
        console.error('Error fetching artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const playArtistTopSong = async (artistId: number) => {
    try {
      // Get artist's songs and play the most popular one
      const songs = await apiService.getSongs({ artist: artistId.toString() });
      if (songs.length > 0) {
        // Sort by play count and play the most popular
        const topSong = songs.sort((a, b) => b.play_count - a.play_count)[0];
        playSong(topSong);
      }
    } catch (error) {
      console.error('Error playing artist song:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Artists</h1>
            <p className="text-gray-400">Discover amazing artists and their music</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-dark-800/30 rounded-xl animate-pulse">
              <div className="w-16 h-16 bg-gray-600 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-600 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Artists</h1>
            <p className="text-gray-400">Discover {artists.length} amazing artists and their music</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-dark-800/30 rounded-lg p-1">
          <button
            onClick={() => setSelectedView('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedView === 'list'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setSelectedView('grid')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedView === 'grid'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Artists Display */}
      {selectedView === 'list' ? (
        <div className="space-y-2">
          {artists.map((artist, index) => (
            <div
              key={artist.id}
              className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-dark-800/50 transition-all duration-200"
            >
              {/* Rank */}
              <div className="w-8 text-center">
                <span className="text-gray-400 text-lg font-medium">{index + 1}</span>
              </div>

              {/* Profile Picture */}
              <div className="relative">
                <img
                  src={artist.profile_picture || '/placeholder-profile.png'}
                  alt={artist.stage_name || artist.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <button
                  onClick={() => playArtistTopSong(artist.id)}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="text-white" size={20} fill="currentColor" />
                </button>
              </div>

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {artist.stage_name || artist.username}
                  </h3>
                  {artist.email_verified && (
                    <Verified className="text-blue-500 flex-shrink-0" size={16} />
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-gray-400 text-sm flex items-center">
                    <Music size={14} className="mr-1" />
                    {artist.songs_count || 0} songs
                  </span>
                  <span className="text-gray-400 text-sm flex items-center">
                    <Disc size={14} className="mr-1" />
                    {artist.albums_count || 0} albums
                  </span>
                </div>
                {artist.bio && (
                  <p className="text-gray-400 text-sm mt-1 truncate">{artist.bio}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Link
                  to={`/home/artist/${artist.id}`}
                  className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                >
                  <span>View Profile</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              to={`/home/artist/${artist.id}`}
              className="group p-4 bg-dark-800/30 rounded-xl hover:bg-dark-800/50 transition-all duration-200 hover:scale-105"
            >
              <div className="relative mb-4">
                <img
                  src={artist.profile_picture || '/placeholder-profile.png'}
                  alt={artist.stage_name || artist.username}
                  className="w-full aspect-square rounded-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    playArtistTopSong(artist.id);
                  }}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                >
                  <Play className="text-white" size={20} fill="currentColor" />
                </button>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <h3 className="text-white font-semibold truncate">
                    {artist.stage_name || artist.username}
                  </h3>
                  {artist.email_verified && (
                    <Verified className="text-blue-500 flex-shrink-0" size={14} />
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {artist.songs_count || 0} songs • {artist.albums_count || 0} albums
                </p>
                {artist.bio && (
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">{artist.bio}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {artists.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-500 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Artists Found</h3>
          <p className="text-gray-500">No artists have joined the platform yet.</p>
        </div>
      )}
    </div>
  );
};

export default Artists;