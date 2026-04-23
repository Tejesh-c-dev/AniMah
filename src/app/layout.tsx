import type { Metadata } from 'next';
import { Navbar, Footer } from '@/components/layout';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'AniMah - Anime, Manhwa & Movies Community',
  description: 'Track and rate anime, manhwa, and movies. Join our community and discover new titles.',
  keywords: 'anime, manhwa, movies, community, tracking, ratings, reviews',
  openGraph: {
    title: 'AniMah',
    description: 'Track and rate anime, manhwa, and movies.',
    url: 'https://animah.vercel.app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
