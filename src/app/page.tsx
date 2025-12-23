import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPageClient from '@/components/LandingPageClient';

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  
  // If there's a code parameter (email confirmation), redirect to auth callback
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard (they should stay logged in)
  if (user) {
    redirect('/dashboard');
  }

  return <LandingPageClient />;
}
