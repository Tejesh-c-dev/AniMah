'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TitleForm from '@/components/titles/TitleForm';
import { Role } from '@/types';

export default function EditTitlePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <ProtectedRoute roles={[Role.USER, Role.ADMIN]}>
      <TitleForm mode="edit" titleId={id} />
    </ProtectedRoute>
  );
}
