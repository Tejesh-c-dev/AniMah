import { PrismaClient } from '@prisma/client';

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;

const databaseUrl = process.env.DATABASE_URL || '';
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && databaseUrl && !databaseUrl.includes('-pooler.')) {
  console.warn(
    '[Prisma] DATABASE_URL does not look like a Neon pooled endpoint. Use the -pooler host in production to reduce connection churn.'
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