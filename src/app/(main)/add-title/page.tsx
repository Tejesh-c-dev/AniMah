'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { TitleType } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AddTitlePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<TitleType>(TitleType.ANIME);
  const [genres, setGenres] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/titles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          releaseYear: parseInt(releaseYear.toString()),
          type,
          genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/titles/${data.id}`);
      } else {
        setError('Failed to create title');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2">Add New Title</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Contribute to our community by adding a new anime, manhwa, or movie.
        </p>

        <Card>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 py-3 rounded"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Title Name"
              placeholder="Enter title name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                placeholder="Enter description"
                className="input min-h-32"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Release Year"
                value={releaseYear}
                onChange={(e) => setReleaseYear(parseInt(e.currentTarget.value))}
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.currentTarget.value as TitleType)}
                  className="input"
                >
                  <option value={TitleType.ANIME}>Anime</option>
                  <option value={TitleType.MANHWA}>Manhwa</option>
                  <option value={TitleType.MOVIE}>Movie</option>
                </select>
              </div>
            </div>

            <Input
              label="Genres (comma-separated)"
              placeholder="e.g., Action, Romance, Drama"
              value={genres}
              onChange={(e) => setGenres(e.currentTarget.value)}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Title'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
