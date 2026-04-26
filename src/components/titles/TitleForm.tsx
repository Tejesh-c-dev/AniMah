'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { ToastContainer } from '@/components/ui/Toast';
import { TitleType } from '@/types';
import { getClientApiUrl } from '@/lib/config';

const API_URL = getClientApiUrl();
const MAX_IMAGE_SIZE_MB = 5;

interface DuplicateState {
  exists: boolean;
  titleId?: string;
}

interface TitleFormProps {
  mode: 'create' | 'edit';
  titleId?: string;
  isEditing?: boolean;
}

interface ToastItem {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export default function TitleForm({ mode, titleId, isEditing }: TitleFormProps) {
  const router = useRouter();
  const effectiveMode = isEditing ? 'edit' : mode;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<TitleType>(TitleType.ANIME);
  const [genres, setGenres] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(effectiveMode === 'edit');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [duplicateState, setDuplicateState] = useState<DuplicateState>({ exists: false });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts((prev) => [...prev, { message, type }]);
  };

  const removeToast = (index: number) => {
    setToasts((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const normalizedName = useMemo(() => name.trim().toLowerCase(), [name]);

  useEffect(() => {
    if (effectiveMode !== 'edit' || !titleId) {
      return;
    }

    const fetchTitle = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/titles/${titleId}`, {
          credentials: 'include',
        });

        if (response.status === 403) {
          router.push('/forbidden');
          return;
        }

        if (!response.ok) {
          setError('Failed to load title details.');
          return;
        }

        const data = await response.json();
        setName(data.name || '');
        setDescription(data.description || '');
        setReleaseYear(data.releaseYear || new Date().getFullYear());
        setType((data.type as TitleType) || TitleType.ANIME);
        setGenres(Array.isArray(data.genres) ? data.genres.join(', ') : '');
        setCoverImage(data.coverImage || undefined);
      } catch {
        setError('Failed to load title details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitle();
  }, [effectiveMode, titleId, router]);

  useEffect(() => {
    if (!normalizedName || normalizedName.length < 2) {
      setDuplicateState({ exists: false });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ name, type });
        const response = await fetch(`${API_URL}/api/titles/check-duplicate?${params}`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (effectiveMode === 'edit' && titleId && data?.title?.id === titleId) {
          setDuplicateState({ exists: false });
          return;
        }

        if (data.exists) {
          setDuplicateState({ exists: true, titleId: data?.title?.id });
        } else {
          setDuplicateState({ exists: false });
        }
      } catch {
        // Ignore live duplicate check errors and allow form submit fallback.
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [effectiveMode, name, normalizedName, titleId, type]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];

    if (!file) {
      setCoverImage(undefined);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image size must be ${MAX_IMAGE_SIZE_MB}MB or less.`);
      return;
    }

    try {
      setError('');
      const imageDataUrl = await readFileAsDataUrl(file);
      setCoverImage(imageDataUrl);
    } catch {
      setError('Failed to process selected image.');
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(undefined);
    setFileInputKey((prev) => prev + 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        description,
        releaseYear: parseInt(releaseYear.toString(), 10),
        type,
        genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        coverImage,
      };

      const endpoint = effectiveMode === 'edit' && titleId ? `${API_URL}/api/titles/${titleId}` : `${API_URL}/api/titles`;
      const method = effectiveMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 403) {
          if (effectiveMode === 'edit') {
            pushToast('You are not authorized to edit this title', 'error');
          } else {
            pushToast('You are not authorized to create a title', 'error');
          }
          return;
        }

        if (response.status === 409) {
          setNameError('This title already exists.');
          const duplicateId = responseBody?.details?.existingTitleId;
          setDuplicateState({ exists: true, titleId: duplicateId });
          return;
        }

        setError(responseBody?.message || 'Failed to save title.');
        return;
      }

      const data = responseBody;
      pushToast(effectiveMode === 'edit' ? 'Title updated successfully' : 'Title created successfully', 'success');
      await new Promise((resolve) => setTimeout(resolve, 700));
      router.push(`/titles/${data.id || titleId}`);
    } catch {
      setError('An unexpected error occurred while saving the title.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = effectiveMode === 'edit' ? 'Edit Title' : 'Add New Title';
  const descriptionText =
    effectiveMode === 'edit'
      ? 'Update details for this title.'
      : 'Contribute to our community by adding a new anime, manhwa, or movie.';

  return (
    <div className="max-w-2xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-2 text-4xl font-bold">{heading}</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{descriptionText}</p>

        {isLoading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading title details...</div>
        ) : (
          <div className="card">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-3 mb-6 text-red-800 bg-red-100 rounded dark:bg-red-900 dark:text-red-100"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Title Name"
                  placeholder="Enter title name"
                  value={name}
                  onChange={(e) => {
                    setName(e.currentTarget.value);
                    setNameError('');
                  }}
                  required
                />
                {(nameError || duplicateState.exists) && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    {nameError || 'This title already exists.'}{' '}
                    {duplicateState.titleId && (
                      <Link href={`/titles/${duplicateState.titleId}`} className="underline">
                        View it here →
                      </Link>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Enter description"
                  className="input min-h-32"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  label="Release Year"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(parseInt(e.currentTarget.value || '0', 10))}
                  required
                />

                <div>
                  <label className="block mb-2 text-sm font-medium">Type</label>
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

              <div>
                <label className="block mb-2 text-sm font-medium">Cover Image</label>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="input"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Optional. JPG, PNG, WEBP or GIF up to {MAX_IMAGE_SIZE_MB}MB.
                </p>
                {coverImage && (
                  <div className="mt-3">
                    <Image
                      src={coverImage}
                      alt="Cover preview"
                      width={160}
                      height={224}
                      unoptimized
                      className="object-cover w-40 h-56 border border-gray-300 rounded dark:border-dark-border"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={handleRemoveImage}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
                {isSubmitting ? 'Saving...' : effectiveMode === 'edit' ? 'Update Title' : 'Create Title'}
              </Button>
            </form>
          </div>
        )}
      </motion.div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
