'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = 'w-full', height = 'h-4', className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${width} ${height} ${className} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <motion.div className="card animate-pulse">
      <Skeleton height="h-64 mb-4" />
      <Skeleton height="h-6 mb-2" width="w-3/4" />
      <Skeleton height="h-4 mb-4" width="w-1/2" />
      <Skeleton height="h-4" count={3} />
    </motion.div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-gray-100 dark:bg-dark-card rounded">
          <Skeleton width="w-1/4" height="h-4" />
          <Skeleton width="w-1/4" height="h-4" />
          <Skeleton width="w-1/4" height="h-4" />
          <Skeleton width="w-1/4" height="h-4" />
        </div>
      ))}
    </div>
  );
};
