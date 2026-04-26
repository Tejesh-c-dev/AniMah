/**
 * Centralized configuration for API base URLs
 *
 * Provides fallback-safe API URL resolution for:
 * - Client components (browser)
 * - Server components (Node.js)
 * - API routes
 * - Vercel production and preview deployments
 */

/**
 * Get the API base URL with intelligent fallbacks.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_API_URL (for client components)
 * 2. API_URL (for server components)
 * 3. VERCEL_URL (for Vercel preview/production - backend assumed on same domain)
 * 4. http://localhost:5000 (local development fallback)
 *
 * @param options.isServer - Force server-side resolution (skip NEXT_PUBLIC_API_URL)
 * @param options.fallback - Custom fallback URL (defaults to localhost:5000)
 * @returns The resolved API base URL (without trailing slash)
 */
export function getApiUrl(options?: {
  isServer?: boolean;
  fallback?: string;
}): string {
  const { isServer = false, fallback = 'http://localhost:5000' } = options ?? {};

  // For client components: prefer NEXT_PUBLIC_API_URL
  if (!isServer && typeof window !== 'undefined') {
    const clientUrl = process.env.NEXT_PUBLIC_API_URL;
    if (clientUrl) {
      return sanitizeUrl(clientUrl);
    }
  }

  // For server components or when NEXT_PUBLIC_API_URL is not set
  const serverUrl = process.env.API_URL;
  if (serverUrl) {
    return sanitizeUrl(serverUrl);
  }

  // Vercel preview/production: if VERCEL_URL is set, assume backend is available
  // This handles cases where backend runs on the same domain or via internal networking
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && process.env.VERCEL) {
    // In production, backend might be on a different domain
    // Fall through to the default fallback or throw if in production
    if (process.env.NODE_ENV !== 'production') {
      // For preview deployments, try to use the Vercel URL
      return `https://${vercelUrl}`;
    }
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return fallback;
  }

  // Production: throw explicit error if no URL configured
  if (process.env.NODE_ENV === 'production') {
    // Don't throw - return empty string to let fetch fail gracefully
    // This prevents server crashes in production
    return '';
  }

  return fallback;
}

/**
 * Get API URL specifically for client-side use.
 * Ensures NEXT_PUBLIC_API_URL is preferred.
 */
export function getClientApiUrl(): string {
  return getApiUrl({ isServer: false });
}

/**
 * Get API URL specifically for server-side use.
 * Checks API_URL first, then falls back to NEXT_PUBLIC_API_URL.
 */
export function getServerApiUrl(): string {
  return getApiUrl({ isServer: true });
}

/**
 * Sanitize URL by removing trailing slashes
 */
function sanitizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Build a complete API endpoint URL
 * @param path - API path (e.g., '/api/auth/login')
 * @param baseUrl - Optional base URL override
 */
export function buildApiUrl(path: string, baseUrl?: string): string {
  const base = baseUrl ?? getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Environment variable validation
 * Returns true if required environment variables are present
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // API_URL is recommended but not strictly required (has fallbacks)
  // NEXT_PUBLIC_API_URL is required for client components in production

  return {
    valid: missing.length === 0,
    missing,
  };
}
