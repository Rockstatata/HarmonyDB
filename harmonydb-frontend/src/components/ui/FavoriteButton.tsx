import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { apiService } from '../../services/apiServices';

interface FavoriteButtonProps {
  itemType: 'song' | 'album' | 'playlist';
  itemId: number;
  className?: string;
  size?: number;
  showTooltip?: boolean;
}

const FavoriteButton = ({ 
  itemType, 
  itemId, 
  className = '', 
  size = 20, 
  showTooltip = true 
}: FavoriteButtonProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const favorited = await apiService.checkIfFavorited(itemType, itemId);
        setIsFavorited(favorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    if (apiService.isAuthenticated()) {
      checkFavoriteStatus();
    }
  }, [itemType, itemId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    if (!apiService.isAuthenticated()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await apiService.toggleFavorite(itemType, itemId);
      setIsFavorited(result.favorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading || !apiService.isAuthenticated()}
      className={`
        transition-all duration-200 
        ${isFavorited 
          ? 'text-primary hover:text-primary-600' 
          : 'text-text-muted hover:text-text-secondary'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={
        showTooltip 
          ? !apiService.isAuthenticated() 
            ? 'Login to add favorites'
            : isFavorited 
              ? 'Remove from favorites' 
              : 'Add to favorites'
          : undefined
      }
    >
      <Heart 
        size={size} 
        className={`
          transition-all duration-200
          ${isFavorited ? 'fill-current' : ''}
          ${isLoading ? 'animate-pulse' : ''}
        `}
      />
    </button>
  );
};

export default FavoriteButton;