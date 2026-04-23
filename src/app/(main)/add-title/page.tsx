'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TitleForm from '@/components/titles/TitleForm';
import { Role } from '@/types';

export default function AddTitlePage() {
  return (
    <ProtectedRoute roles={[Role.USER, Role.ADMIN]}>
      <TitleForm mode="create" />
    </ProtectedRoute>
  );
}
