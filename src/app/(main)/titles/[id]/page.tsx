'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Button, Badge } from '@/components/ui';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ToastContainer } from '@/components/ui/Toast';
import StarRating from '@/components/ui/StarRating';
import FavoriteButton from '@/components/ui/FavoriteButton';
import WatchlistDropdown from '@/components/ui/WatchlistDropdown';
import { useAuth } from '@/hooks/useAuth';
import { Role, WatchStatus } from '@/types';
import { getClientApiUrl } from '@/lib/config';

const API_URL = getClientApiUrl();

interface TitleDetail {
  id: string;
  name: string;
  creatorId?: string;
  description: string;
  releaseYear: number;
  type: string;
  coverImage?: string;
  genres: string[];
  reviewCount: number;
  averageRating: number;
  isFavorited?: boolean;
  watchlistStatus?: WatchStatus | null;
  reviews: Array<{
    id: string;
    rating: number;
    content: string;
    helpful: number;
    notHelpful: number;
    createdAt: string;
    user: {
      username: string;
    };
  }>;
}

interface ToastItem {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export default function TitleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState<TitleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingTitle, setIsDeletingTitle] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts((prev) => [...prev, { message, type }]);
  };

  const removeToast = (index: number) => {
    setToasts((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const fetchTitle = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/titles/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTitle(data);
      }
    } catch (error) {
      console.error('Failed to fetch title:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchTitle();
  }, [fetchTitle]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleId: title.id,
          rating: reviewRating,
          content: reviewContent,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setReviewRating(5);
        setReviewContent('');
        setShowReviewForm(false);
        await fetchTitle();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async (_isFavorited: boolean) => {
    if (!user || !title) return;

    try {
      await fetch(`${API_URL}/api/favorites/toggle/${title.id}`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleUpdateWatchlist = async (status: WatchStatus | null) => {
    if (!user || !title) return;

    try {
      if (status === null) {
        await fetch(`${API_URL}/api/watchlist/${title.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } else {
        // Add or update watchlist
        if (title.watchlistStatus) {
          // Update existing
          await fetch(`${API_URL}/api/watchlist/${title.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include',
          });
        } else {
          // Add new
          await fetch(`${API_URL}/api/watchlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titleId: title.id, status }),
            credentials: 'include',
          });
        }
      }
      await fetchTitle();
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  const canManageTitle =
    !!user && !!title && (user.role === Role.ADMIN || title.creatorId === user.id);

  const handleDeleteTitle = async () => {
    if (!title || !canManageTitle) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete [${title.name}]? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeletingTitle(true);
    try {
      const response = await fetch(`${API_URL}/api/titles/${title.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 403) {
        pushToast('You are not authorized to delete this title', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        pushToast(errorData?.message || 'Failed to delete title.', 'error');
        return;
      }

      pushToast('Title deleted', 'success');
      await new Promise((resolve) => setTimeout(resolve, 700));
      router.push('/');
    } catch {
      pushToast('An unexpected error occurred while deleting this title.', 'error');
    } finally {
      setIsDeletingTitle(false);
    }
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (!title) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">Title not found</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
      >
        {/* Cover Image */}
        <div className="md:col-span-1">
          {title.coverImage ? (
            <Image
              src={title.coverImage}
              alt={title.name}
              width={384}
              height={576}
              unoptimized
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-8xl">📺</span>
            </div>
          )}
        </div>

        {/* Title Info */}
        <div className="md:col-span-3">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title.name}</h1>

          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="primary">{title.type}</Badge>
            <Badge variant="secondary">{title.releaseYear}</Badge>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(title.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-2xl font-bold">{title.averageRating.toFixed(1)}/5</span>
              <span className="text-gray-600 dark:text-gray-400">({title.reviewCount} reviews)</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{title.description}</p>

          {/* Genres */}
          {title.genres.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {title.genres.map((genre) => (
                  <Badge key={genre} variant="success">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user && (
            <div className="flex flex-wrap gap-3">
              <WatchlistDropdown
                currentStatus={title.watchlistStatus}
                onStatusChange={handleUpdateWatchlist}
              />
              <FavoriteButton
                isFavorited={title.isFavorited}
                onToggle={handleToggleFavorite}
              />
              {canManageTitle && (
                <>
                  <Link href={`/titles/${title.id}/edit`}>
                    <Button variant="secondary">Edit Title</Button>
                  </Link>
                  <Button variant="danger" onClick={handleDeleteTitle} isLoading={isDeletingTitle}>
                    {isDeletingTitle ? 'Deleting...' : 'Delete Title'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Community Reviews</h2>
          {user && (
            <Button
              variant="primary"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {showReviewForm ? 'Cancel' : 'Write Review'}
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && user && (
          <Card className="mb-6">
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <StarRating rating={reviewRating} onRate={setReviewRating} size="lg" showText={true} />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.currentTarget.value)}
                  placeholder="Share your thoughts about this title..."
                  className="input min-h-32"
                  required
                />
              </div>

              <Button type="submit" variant="primary" isLoading={isSubmitting} fullWidth>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {title.reviews.length > 0 ? (
            title.reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold">{review.user.username}</p>
                    <StarRating rating={review.rating} readonly={true} showText={true} />
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4">{review.content}</p>

                <div className="flex gap-4 text-sm">
                  <button className="text-blue-500 hover:text-blue-600">👍 Helpful ({review.helpful})</button>
                  <button className="text-gray-500 hover:text-gray-600">👎 Not Helpful ({review.notHelpful})</button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review!</p>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
