import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Вход' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <LoginForm nextPath={params.next ?? '/'} />;
}
