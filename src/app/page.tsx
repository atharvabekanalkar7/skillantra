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

  // Check if user is logged in — fail fast if Supabase is unreachable
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (error: any) {
    // If Supabase is unreachable (paused/down), show landing page anyway
    // instead of blocking for 10+ seconds and then crashing
    const msg = (error?.message || '').toLowerCase();
    const causeCode = error?.cause?.code || '';
    const isConnError = (
      msg.includes('fetch failed') || msg.includes('connect timeout') ||
      causeCode === 'UND_ERR_CONNECT_TIMEOUT' || causeCode === 'ECONNREFUSED' ||
      error?.name === 'AuthRetryableFetchError'
    );

    if (isConnError) {
      console.warn('Landing page: Supabase unreachable, showing landing page');
      // Fall through to show landing page
    } else {
      // For other errors (like missing env vars), also show landing page
      console.error('Landing page auth check error:', error?.message);
    }
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return <LandingPageClient />;
}
