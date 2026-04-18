'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <motion.div whileHover={{ y: -4 }}>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              🎬 AniMah
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your community platform for tracking anime, manhwa, and movies.
            </p>
          </motion.div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                  Browse
                </a>
              </li>
              <li>
                <a href="/add-title" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                  Add Title
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                  Profile
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-bold mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-600 dark:text-gray-400">💬 Community Reviews</li>
              <li className="text-gray-600 dark:text-gray-400">📝 Watchlist & Favorites</li>
              <li className="text-gray-600 dark:text-gray-400">⭐ Rating System</li>
              <li className="text-gray-600 dark:text-gray-400">👥 User Profiles</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                Twitter
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                Discord
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {currentYear} AniMah. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
