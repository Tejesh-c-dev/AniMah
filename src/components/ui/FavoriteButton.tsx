'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FavoriteButtonProps {
  isFavorited?: boolean;
  onToggle: (isFavorited: boolean) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorited = false,
  onToggle,
  size = 'md',
  showText = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onToggle(!favorited);
      setFavorited(!favorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-400'
      }`}
    >
      <svg
        className={`${sizeMap[size]} ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-600'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
      </svg>
      {showText && <span className="text-sm font-medium">{favorited ? 'Favorited' : 'Add to Favorites'}</span>}
    </motion.button>
  );
};

export default FavoriteButton;
