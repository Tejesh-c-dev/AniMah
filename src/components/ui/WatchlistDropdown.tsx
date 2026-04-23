'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WatchStatus } from '@/types';

interface WatchlistDropdownProps {
  currentStatus?: WatchStatus | null;
  onStatusChange: (status: WatchStatus | null) => Promise<void>;
}

const WatchlistDropdown: React.FC<WatchlistDropdownProps> = ({
  currentStatus = null,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions: { value: WatchStatus | null; label: string; color: string }[] = [
    { value: WatchStatus.PLAN_TO_WATCH, label: 'Plan to Watch', color: 'bg-blue-100 text-blue-800' },
    { value: WatchStatus.WATCHING, label: 'Watching', color: 'bg-green-100 text-green-800' },
    { value: WatchStatus.COMPLETED, label: 'Completed', color: 'bg-purple-100 text-purple-800' },
    { value: WatchStatus.DROPPED, label: 'Dropped', color: 'bg-red-100 text-red-800' },
    { value: null, label: 'Remove from Watchlist', color: 'bg-gray-100 text-gray-800' },
  ];

  const currentOption = statusOptions.find((opt) => opt.value === currentStatus);

  const handleStatusChange = async (status: WatchStatus | null) => {
    setIsLoading(true);
    try {
      await onStatusChange(status);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing watchlist status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block w-full md:w-64">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <span className={currentOption ? `${currentOption.color} px-2 py-1 rounded text-sm font-medium` : 'text-sm'}>
            {currentOption?.label || 'Add to Watchlist'}
          </span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-50"
        >
          {statusOptions.map((option) => (
            <motion.button
              key={option.value || 'remove'}
              onClick={() => handleStatusChange(option.value)}
              disabled={isLoading}
              className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currentStatus === option.value ? 'bg-blue-50 dark:bg-blue-900' : ''
              }`}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center gap-2">
                {currentStatus === option.value && <span className="text-blue-500">✓</span>}
                <span className={option.color}>{option.label}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default WatchlistDropdown;
