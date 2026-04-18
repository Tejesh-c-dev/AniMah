'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'titles' | 'stats'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== Role.ADMIN)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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

  if (authLoading || !user || user.role !== Role.ADMIN) {
    return null;
  }

  return (
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
            <p className="text-gray-600 dark:text-gray-400">User management features coming soon</p>
          </motion.div>
        )}

        {/* Titles Tab */}
        {activeTab === 'titles' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-gray-600 dark:text-gray-400">Title management features coming soon</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
