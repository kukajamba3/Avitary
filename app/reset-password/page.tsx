import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Восстановление пароля' };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ update?: string }> }) {
  const params = await searchParams;
  return <ResetPasswordForm updateMode={params.update === '1'} />;
}
