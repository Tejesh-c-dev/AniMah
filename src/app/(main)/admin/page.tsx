'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, Skeleton, Button, Input, Badge } from '@/components/ui';
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
  _count?: {
    reviews: number;
    favorites: number;
    watchlist: number;
  };
}

interface AdminTitle {
  id: string;
  name: string;
  type: string;
  releaseYear: number;
  createdAt: string;
  _count?: {
    reviews: number;
    favorites: number;
    watchlist: number;
  };
}

interface AdminStats {
  overview: {
    totalUsers: number;
    totalTitles: number;
    totalReviews: number;
    totalWatchlistEntries: number;
    totalFavorites: number;
  };
  recentStats: {
    newUsersLast7Days: number;
    totalAdmins: number;
  };
  trendingTitles: AdminTitle[];
  recentUsers: { id: string; username: string; createdAt: string }[];
}

type TabType = 'stats' | 'users' | 'titles';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [titles, setTitles] = useState<AdminTitle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isTitlesLoading, setIsTitlesLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingTitleId, setDeletingTitleId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (actionError || actionSuccess) {
      const timer = setTimeout(() => {
        setActionError('');
        setActionSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [actionError, actionSuccess]);

  // Fetch stats
  useEffect(() => {
    if (!user || user.role !== Role.ADMIN) return;

    const fetchStats = async () => {
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
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch users with search and pagination
  const fetchUsers = useCallback(async (page = 1, search = '') => {
    if (!user || user.role !== Role.ADMIN) return;

    setIsUsersLoading(true);
    setActionError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(20),
        ...(search && { search }),
      });

      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setActionError(errorData?.message || 'Failed to fetch users.');
        return;
      }

      const data = await response.json();
      setUsers(Array.isArray(data?.data) ? data.data : []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch {
      setActionError('Failed to fetch users.');
    } finally {
      setIsUsersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1, searchQuery);
    }
  }, [activeTab, searchQuery, fetchUsers]);

  // Fetch titles
  useEffect(() => {
    if (!user || user.role !== Role.ADMIN || activeTab !== 'titles') return;

    const fetchTitles = async () => {
      setIsTitlesLoading(true);
      setActionError('');
      try {
        const response = await fetch(`${API_URL}/api/admin/titles?limit=50`, {
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

  // Handle user promotion
  const handlePromoteUser = async (targetUser: AdminUser) => {
    setProcessingUserId(targetUser.id);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/promote`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to promote user.');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: Role.ADMIN } : u))
      );
      setActionSuccess(`User ${targetUser.username} promoted to admin.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to promote user.');
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle user demotion
  const handleDemoteUser = async (targetUser: AdminUser) => {
    const confirmed = window.confirm(
      `Demote ${targetUser.username} from admin to user? This action can be reverted.`
    );
    if (!confirmed) return;

    setProcessingUserId(targetUser.id);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/demote`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to demote user.');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: Role.USER } : u))
      );
      setActionSuccess(`Admin ${targetUser.username} demoted to user.`);

      // Refresh stats
      if (stats) {
        setStats({
          ...stats,
          recentStats: {
            ...stats.recentStats,
            totalAdmins: stats.recentStats.totalAdmins - 1,
          },
        });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to demote user.');
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (targetUser: AdminUser) => {
    const confirmed = window.confirm(
      `Delete user ${targetUser.username}? This action cannot be undone and will remove all their reviews, watchlist, and favorites.`
    );
    if (!confirmed) return;

    setDeletingUserId(targetUser.id);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete user.');
      }

      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      setActionSuccess(`User ${targetUser.username} deleted successfully.`);

      // Refresh stats
      if (stats) {
        setStats({
          ...stats,
          overview: {
            ...stats.overview,
            totalUsers: stats.overview.totalUsers - 1,
          },
        });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Handle title deletion
  const handleDeleteTitle = async (targetTitle: AdminTitle) => {
    const confirmed = window.confirm(
      `Delete title ${targetTitle.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingTitleId(targetTitle.id);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/titles/${targetTitle.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete title.');
      }

      setTitles((prev) => prev.filter((t) => t.id !== targetTitle.id));
      setActionSuccess(`Title ${targetTitle.name} deleted successfully.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete title.');
    } finally {
      setDeletingTitleId(null);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchQuery);
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
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <Badge variant="danger">ADMIN</Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, titles, and view platform statistics
          </p>
        </motion.div>

        {/* Action Messages */}
        {(actionError || actionSuccess) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {actionError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                {actionSuccess}
              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-8">
            {(['stats', 'users', 'titles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
              className="space-y-8"
            >
              {isLoading ? (
                <Skeleton count={5} />
              ) : stats ? (
                <>
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(stats.overview).map(([key, value]) => (
                      <Card key={key} className="p-6">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {String(value)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {/* Recent Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">New users (7 days)</span>
                          <span className="font-semibold">{stats.recentStats.newUsersLast7Days}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total admins</span>
                          <span className="font-semibold">{stats.recentStats.totalAdmins}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Recent Users */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Signups</h3>
                      <div className="space-y-2">
                        {stats.recentUsers.map((u) => (
                          <div key={u.id} className="flex justify-between items-center">
                            <span className="font-medium">{u.username}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Trending Titles */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Trending Titles</h3>
                    <div className="space-y-3">
                      {stats.trendingTitles.map((title, idx) => (
                        <div key={title.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium">{title.name}</p>
                              <p className="text-xs text-gray-500">
                                {title.type} • {title.releaseYear}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {title._count?.reviews || 0} reviews
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {title._count?.favorites || 0} favorites
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
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
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="primary">
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      fetchUsers(1, '');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </form>

              {/* Users List */}
              {isUsersLoading ? (
                <Skeleton count={5} />
              ) : users.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {users.map((userItem) => (
                    <Card key={userItem.id} className="p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{userItem.username}</span>
                            <Badge variant={userItem.role === Role.ADMIN ? 'danger' : 'secondary'}>
                              {userItem.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {userItem.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Joined {new Date(userItem.createdAt).toLocaleDateString()}
                            {userItem._count && (
                              <span className="ml-2">
                                • {userItem._count.reviews} reviews
                                • {userItem._count.favorites} favorites
                                • {userItem._count.watchlist} watchlist
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {userItem.role === Role.USER ? (
                            <Button
                              variant="success"
                              size="sm"
                              disabled={processingUserId === userItem.id || userItem.id === user.id}
                              onClick={() => handlePromoteUser(userItem)}
                            >
                              {processingUserId === userItem.id ? 'Processing...' : 'Promote'}
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={processingUserId === userItem.id || userItem.id === user.id}
                              onClick={() => handleDemoteUser(userItem)}
                            >
                              {processingUserId === userItem.id ? 'Processing...' : 'Demote'}
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={
                              deletingUserId === userItem.id ||
                              userItem.id === user.id ||
                              userItem.role === Role.ADMIN
                            }
                            onClick={() => handleDeleteUser(userItem)}
                          >
                            {deletingUserId === userItem.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => fetchUsers(pagination.page - 1, searchQuery)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => fetchUsers(pagination.page + 1, searchQuery)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
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
                <Skeleton count={5} />
              ) : titles.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No titles found.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {titles.map((titleItem) => (
                    <Card key={titleItem.id} className="p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{titleItem.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {titleItem.type} • {titleItem.releaseYear}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Added {new Date(titleItem.createdAt).toLocaleDateString()}
                            {titleItem._count && (
                              <span className="ml-2">
                                • {titleItem._count.reviews} reviews
                                • {titleItem._count.favorites} favorites
                                • {titleItem._count.watchlist} in watchlist
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deletingTitleId === titleItem.id}
                            onClick={() => handleDeleteTitle(titleItem)}
                          >
                            {deletingTitleId === titleItem.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
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
