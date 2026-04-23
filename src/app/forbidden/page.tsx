import Link from 'next/link';
import { Button } from '@/components/ui';

export default function ForbiddenPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">403 Forbidden</p>
      <h1 className="text-4xl font-bold mb-4">You do not have access to this page</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Your account does not have the required permission for this action.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/">
          <Button variant="secondary">Go Home</Button>
        </Link>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
