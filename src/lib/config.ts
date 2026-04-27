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
  const normalizedFallback = sanitizeUrl(fallback);
  const publicApiUrl = readEnvUrl(process.env.NEXT_PUBLIC_API_URL);
  const serverApiUrl = readEnvUrl(process.env.API_URL);

  // For client components: prefer NEXT_PUBLIC_API_URL
  if (!isServer && typeof window !== 'undefined') {
    if (publicApiUrl) {
      return publicApiUrl;
    }

    if (serverApiUrl) {
      return serverApiUrl;
    }

    if (process.env.NODE_ENV === 'development') {
      return normalizedFallback;
    }

    // Last-resort client fallback for same-origin API deployments.
    return sanitizeUrl(window.location.origin);
  }

  if (serverApiUrl) {
    return serverApiUrl;
  }

  if (publicApiUrl) {
    return publicApiUrl;
  }

  // Vercel preview/production: if VERCEL_URL is set, assume backend is available
  // This handles cases where backend runs on the same domain.
  const vercelUrl = readEnvUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    if (vercelUrl.startsWith('http://') || vercelUrl.startsWith('https://')) {
      return vercelUrl;
    }

    return `https://${vercelUrl}`;
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return normalizedFallback;
  }

  // Production: return empty string; callers should provide graceful fallback UI
  // and explicitly warn about missing configuration
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️  WARNING: API URL not configured in production!\n' +
      'Set one of the following environment variables in Vercel Project Settings → Environment Variables:\n' +
      '  - NEXT_PUBLIC_API_URL (for client-side API calls)\n' +
      '  - API_URL (for server-side API calls)\n' +
      '  - Or deploy backend to same Vercel project (uses VERCEL_URL automatically)\n' +
      'See: https://vercel.com/docs/projects/environment-variables'
    );
    return '';
  }

  return normalizedFallback;
}

/**
 * Get API URL specifically for client-side use.
 * Ensures NEXT_PUBLIC_API_URL is preferred.
 * Throws error if not configured in production.
 */
export function getClientApiUrl(): string {
  const url = getApiUrl({ isServer: false });
  
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL in production. ' +
      'Set NEXT_PUBLIC_API_URL in Vercel Project Settings → Environment Variables.'
    );
  }
  
  return url;
}

/**
 * Get API URL specifically for server-side use.
 * Checks API_URL first, then falls back to NEXT_PUBLIC_API_URL.
 * Throws error if not configured in production.
 */
export function getServerApiUrl(): string {
  const url = getApiUrl({ isServer: true });
  
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing API_URL in production. ' +
      'Set API_URL in Vercel Project Settings → Environment Variables.'
    );
  }
  
  return url;
}

/**
 * Sanitize URL by removing trailing slashes
 */
function sanitizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function readEnvUrl(value: string | undefined): string {
  if (!value || !value.trim()) {
    return '';
  }

  return sanitizeUrl(value.trim());
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
