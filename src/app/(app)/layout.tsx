import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppLayoutClient from './AppLayoutClient';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';

function isProfileComplete(profile: any): boolean {
  if (!profile) return false;
  if (profile.user_type === 'recruiter') {
    return !!(profile.name && profile.company_name && profile.email && profile.phone_number && profile.company_description);
  }
  return !!(profile.name && profile.bio && profile.skills && profile.degree_level);
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // No session — if middleware let us through, it's demo mode. Otherwise redirect.
  if (!session) {
    // Middleware already handles demo bypass — if we reach here with no session
    // and middleware passed us through, treat as demo. Otherwise redirect.
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 absolute top-0 left-0"></div>
          </div>
        </div>
      }>
        <AppLayoutClient profileComplete={true} isDemo={true}>
          {children}
        </AppLayoutClient>
      </Suspense>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  const profileComplete = isProfileComplete(profile);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex overflow-x-hidden overflow-y-visible">
        <Sidebar isDemo={false} />
        <MobileHeader onMenuToggle={() => { }} isDemo={false} />
        <main className="flex-1 w-full min-w-0 md:ml-64 p-4 md:p-8 pt-14 md:pt-8">
          <div className="flex items-center justify-center p-8 min-h-[200px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 absolute top-0 left-0"></div>
            </div>
          </div>
        </main>
      </div>
    }>
      <AppLayoutClient profileComplete={profileComplete} isDemo={false}>
        {children}
      </AppLayoutClient>
    </Suspense>
  );
}
