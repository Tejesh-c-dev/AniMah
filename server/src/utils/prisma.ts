import { PrismaClient } from '@prisma/client';

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;

const databaseUrl = process.env.DATABASE_URL || '';
const directUrl = process.env.DIRECT_URL || '';
const isProduction = process.env.NODE_ENV === 'production';
const isServerlessRuntime = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.K_SERVICE
);
const isNeonUrl = databaseUrl.includes('neon.tech');

const hasConnectionParam = (value: string, name: string, expectedValue?: string): boolean => {
  const queryIndex = value.indexOf('?');
  if (queryIndex === -1) {
    return false;
  }

  const params = new URLSearchParams(value.slice(queryIndex + 1));
  const actual = params.get(name);
  if (actual === null) {
    return false;
  }

  if (expectedValue === undefined) {
    return true;
  }

  return actual.toLowerCase() === expectedValue.toLowerCase();
};

if (!databaseUrl.trim()) {
  throw new Error('DATABASE_URL is required for Prisma initialization.');
}

if (isProduction && databaseUrl && !databaseUrl.includes('-pooler.')) {
  console.warn(
    '[Prisma] DATABASE_URL does not look like a Neon pooled endpoint. Use the -pooler host in production to reduce connection churn.'
  );
}

if (isNeonUrl && !hasConnectionParam(databaseUrl, 'sslmode', 'require')) {
  console.warn(
    '[Prisma] DATABASE_URL is missing sslmode=require. Neon connections should enforce SSL.'
  );
}

if (isServerlessRuntime && isNeonUrl && !hasConnectionParam(databaseUrl, 'pgbouncer', 'true')) {
  console.warn(
    '[Prisma] DATABASE_URL is missing pgbouncer=true in a serverless runtime. Add it when using Neon pooling with Prisma.'
  );
}

if (directUrl && directUrl.includes('-pooler.')) {
  console.warn(
    '[Prisma] DIRECT_URL should point to the direct Neon endpoint (non-pooler host) for migrations.'
  );
}

if (directUrl && !hasConnectionParam(directUrl, 'sslmode', 'require')) {
  console.warn(
    '[Prisma] DIRECT_URL is missing sslmode=require. Neon direct connections should enforce SSL.'
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const shutdown = async () => {
  await prisma.$disconnect();
};

process.once('beforeExit', () => {
  void shutdown();
});

process.once('SIGINT', () => {
  void shutdown().finally(() => process.exit(0));
});

process.once('SIGTERM', () => {
  void shutdown().finally(() => process.exit(0));
});