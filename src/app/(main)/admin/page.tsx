'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Skeleton, Button } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface AdminTitle {
  id: string;
  name: string;
  type: string;
  releaseYear: number;
  createdAt: string;
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'titles' | 'stats'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [titles, setTitles] = useState<AdminTitle[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isTitlesLoading, setIsTitlesLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingTitleId, setDeletingTitleId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== Role.ADMIN) return;

    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== Role.ADMIN || activeTab !== 'users') {
      return;
    }

    const fetchUsers = async () => {
      setIsUsersLoading(true);
      setActionError('');
      try {
        const response = await fetch(`${API_URL}/api/admin/users?limit=100`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          setActionError(errorData?.message || 'Failed to fetch users.');
          return;
        }

        const data = await response.json();
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setActionError('Failed to fetch users.');
      } finally {
        setIsUsersLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || user.role !== Role.ADMIN || activeTab !== 'titles') {
      return;
    }

    const fetchTitles = async () => {
      setIsTitlesLoading(true);
      setActionError('');
      try {
        const response = await fetch(`${API_URL}/api/admin/titles?limit=100`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          setActionError(errorData?.message || 'Failed to fetch titles.');
          return;
        }

        const data = await response.json();
        setTitles(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setActionError('Failed to fetch titles.');
      } finally {
        setIsTitlesLoading(false);
      }
    };

    fetchTitles();
  }, [activeTab, user]);

  const handleDeleteUser = async (targetUser: AdminUser) => {
    const confirmed = window.confirm(
      `Delete user ${targetUser.username}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingUserId(targetUser.id);
    setActionError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setActionError(errorData?.message || 'Failed to delete user.');
        return;
      }

      setUsers((prev) => prev.filter((userItem) => userItem.id !== targetUser.id));
    } catch {
      setActionError('Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteTitle = async (targetTitle: AdminTitle) => {
    const confirmed = window.confirm(
      `Delete title ${targetTitle.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingTitleId(targetTitle.id);
    setActionError('');
    try {
      const response = await fetch(`${API_URL}/api/titles/${targetTitle.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setActionError(errorData?.message || 'Failed to delete title.');
        return;
      }

      setTitles((prev) => prev.filter((titleItem) => titleItem.id !== targetTitle.id));
    } catch {
      setActionError('Failed to delete title.');
    } finally {
      setDeletingTitleId(null);
    }
  };

  if (authLoading || !user || user.role !== Role.ADMIN) {
    return null;
  }

  return (
    <ProtectedRoute role={Role.ADMIN}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, titles, and view platform statistics
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        {actionError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {actionError}
          </div>
        )}

        <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-8">
          {(['stats', 'users', 'titles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isLoading ? (
              <Skeleton />
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {Object.entries(stats.overview).map(([key, value]) => (
                  <Card key={key} className="text-center p-6">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {String(value)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                  </Card>
                ))}
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {isUsersLoading ? (
              <Skeleton count={3} />
            ) : users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No users found.</p>
            ) : (
              <div className="space-y-3">
                {users.map((userItem) => (
                  <Card key={userItem.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{userItem.username}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{userItem.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {userItem.role} • Joined {new Date(userItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deletingUserId === userItem.id || userItem.id === user.id}
                      onClick={() => handleDeleteUser(userItem)}
                    >
                      {deletingUserId === userItem.id ? 'Deleting...' : 'Delete User'}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Titles Tab */}
        {activeTab === 'titles' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {isTitlesLoading ? (
              <Skeleton count={3} />
            ) : titles.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No titles found.</p>
            ) : (
              <div className="space-y-3">
                {titles.map((titleItem) => (
                  <Card key={titleItem.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{titleItem.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {titleItem.type} • {titleItem.releaseYear}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Added {new Date(titleItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deletingTitleId === titleItem.id}
                      onClick={() => handleDeleteTitle(titleItem)}
                    >
                      {deletingTitleId === titleItem.id ? 'Deleting...' : 'Delete Title'}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
      </div>
    </ProtectedRoute>
  );
}
