'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

interface NavItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
  isAdmin?: boolean;
}

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { href: '/', label: 'Browse' },
    { href: '/add-title', label: 'Add Title', requiresAuth: true },
    { href: '/profile', label: 'Profile', requiresAuth: true },
  ];

  if (user?.role === Role.ADMIN) {
    navItems.push({ href: '/admin', label: 'Admin', requiresAuth: true, isAdmin: true });
  }

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
            >
              🎬 AniMah
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              (!item.requiresAuth || user) && (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium flex items-center gap-1"
                >
                  {item.label}
                  {item.isAdmin && user?.role === Role.ADMIN && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                      ADM
                    </span>
                  )}
                </Link>
              )
            ))}

            <div className="flex items-center gap-4 border-l border-gray-200 dark:border-dark-border pl-6">
              <ThemeToggle />

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-700 dark:text-gray-200 hover:text-blue-500 flex items-center gap-2"
                  >
                    {user.username}
                    {user.role === Role.ADMIN && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                        ADM
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      void logout();
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary text-sm">
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-primary text-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 dark:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-dark-border py-4 space-y-3"
          >
            {navItems.map((item) => (
              (!item.requiresAuth || user) && (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-gray-700 dark:text-gray-200 hover:text-blue-500 px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block text-gray-700 dark:text-gray-200 hover:text-blue-500 px-2 py-1 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {user.username}
                  {user.role === Role.ADMIN && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                      ADM
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    void logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full btn btn-secondary text-left px-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block btn btn-secondary text-center">
                  Login
                </Link>
                <Link href="/register" className="block btn btn-primary text-center">
                  Sign Up
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
