'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';
import Link from 'next/link';
import { getClientApiUrl } from '@/lib/config';

const API_URL = getClientApiUrl();

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites' | 'reviews'>('watchlist');
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setIsLoadingData(true);
      try {
        const [watchlistRes, favoritesRes] = await Promise.all([
          fetch(`${API_URL}/api/watchlist`, { credentials: 'include' }),
          fetch(`${API_URL}/api/favorites`, { credentials: 'include' }),
        ]);

        if (watchlistRes.ok) {
          const data = await watchlistRes.json();
          setWatchlist(data.data);
        }

        if (favoritesRes.ok) {
          const data = await favoritesRes.json();
          setFavorites(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (authLoading) {
    return <Skeleton />;
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <Card className="flex items-center gap-6 p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-5xl">
            👤
          </div>

          <div className="flex-grow">
            <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>

            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant={user.role === Role.ADMIN ? 'danger' : 'primary'}>
                {user.role === Role.ADMIN ? 'ADMIN' : 'USER'}
              </Badge>
              {user.role === Role.ADMIN && (
                <Link href="/admin">
                  <Button variant="danger" size="sm">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-8">
          {(['watchlist', 'favorites', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {isLoadingData ? (
              <Skeleton count={3} />
            ) : watchlist.length > 0 ? (
              watchlist.map((entry: any) => (
                <Card key={entry.id} className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-bold text-lg">{entry.title.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <Badge variant="primary">{entry.status}</Badge>
                    </p>
                  </div>
                  <Link href={`/titles/${entry.title.id}`}>
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </Link>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No items in your watchlist yet</p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {isLoadingData ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)
            ) : favorites.length > 0 ? (
              favorites.map((fav: any) => (
                <Link key={fav.id} href={`/titles/${fav.title.id}`}>
                  <Card hoverable clickable>
                    <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-600 rounded mb-4 flex items-center justify-center text-6xl">
                      ❤️
                    </div>
                    <h3 className="font-bold text-lg mb-2">{fav.title.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {fav.title.releaseYear}
                    </p>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="col-span-full text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No favorites yet</p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 dark:text-gray-400">Your reviews will appear here</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
