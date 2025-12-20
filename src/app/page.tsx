import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPageClient from '@/components/LandingPageClient';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard (don't log them out)
  if (user) {
    redirect('/dashboard');
  }

  return <LandingPageClient />;
}
