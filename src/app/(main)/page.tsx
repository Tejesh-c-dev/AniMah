'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { TitleType } from '@/types';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Title {
  id: string;
  name: string;
  description: string;
  releaseYear: number;
  type: TitleType;
  coverImage?: string;
  genres: string[];
}

interface PaginatedResponse {
  data: Title[];
  pagination: {
    page: number;
    total: number;
    pages: number;
  };
}

export default function HomePage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTitles = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          type: selectedType,
          search: searchQuery,
          page: currentPage.toString(),
          limit: '12',
        });

        const response = await fetch(`${API_URL}/api/titles?${params}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data: PaginatedResponse = await response.json();
          setTitles(data.data);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        console.error('Failed to fetch titles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitles();
  }, [selectedType, searchQuery, currentPage]);

  const types = [
    { value: 'ALL', label: '🎬 All' },
    { value: 'ANIME', label: '📺 Anime' },
    { value: 'MANHWA', label: '📖 Manhwa' },
    { value: 'MOVIE', label: '🎥 Movies' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Discover Titles
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Explore anime, manhwa, and movies. Track what you watch, rate and review titles, and discover new favorites.
        </p>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-4"
      >
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search titles by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
              setCurrentPage(1);
            }}
            className="input w-full pl-10"
          />
          <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-3">
          {types.map((type) => (
            <motion.button
              key={type.value}
              onClick={() => {
                setSelectedType(type.value);
                setCurrentPage(1);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedType === type.value
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {type.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Titles Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
      >
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
          : titles.length > 0
            ? titles.map((title) => (
                <Link key={title.id} href={`/titles/${title.id}`}>
                  <Card hoverable clickable className="h-full flex flex-col">
                    {/* Cover Image */}
                    {title.coverImage ? (
                      <img
                        src={title.coverImage}
                        alt={title.name}
                        className="w-full h-64 object-cover rounded mb-4"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded mb-4 flex items-center justify-center">
                        <span className="text-4xl">📺</span>
                      </div>
                    )}

                    {/* Title Info */}
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">{title.name}</h3>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded">
                        {title.type}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{title.releaseYear}</span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-grow mb-3">
                      {title.description}
                    </p>

                    {/* Genres */}
                    {title.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {title.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-border rounded text-gray-700 dark:text-gray-300"
                          >
                            {genre}
                          </span>
                        ))}
                        {title.genres.length > 3 && (
                          <span className="text-xs px-2 py-1 text-gray-500">+{title.genres.length - 3}</span>
                        )}
                      </div>
                    )}

                    <Button variant="primary" size="sm" fullWidth>
                      View Details
                    </Button>
                  </Card>
                </Link>
              ))
            : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">No titles found. Try adjusting your filters.</p>
              </div>
            )}
      </motion.div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 mb-12"
        >
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
            return (
              <motion.button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                {pageNum}
              </motion.button>
            );
          })}

          <Button
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </Button>
        </motion.div>
      )}
    </div>
  );
}
