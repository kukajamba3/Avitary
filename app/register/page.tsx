import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Создать профиль' };

export default function RegisterPage() {
  return <RegisterForm />;
}
