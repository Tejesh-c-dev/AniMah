'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: Role;
  roles?: Role[];
}

export default function ProtectedRoute({ children, role, roles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const allowedRoles = useMemo(() => roles || (role ? [role] : []), [role, roles]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace('/forbidden');
    }
  }, [allowedRoles, isLoading, router, user]);

  if (isLoading || !user) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
