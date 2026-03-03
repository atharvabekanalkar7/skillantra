import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppCard } from '@/components/ui/app-card';
import { Lock } from 'lucide-react';

async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const isDemo = resolvedSearchParams?.demo === 'true';

  if (isDemo) {
    return (
      <div className="opacity-0 animate-fade-in-up h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 mb-6">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>

            <h2 className="text-xl font-semibold text-slate-200">
              Sign In Required
            </h2>

            <p className="mt-3 text-sm text-slate-500 max-w-md">
              Please sign in to access this feature.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = await getProfile();

  return (
    <div className="opacity-0 animate-fade-in-up max-w-3xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400 text-sm sm:text-base">Manage your account settings</p>
      </div>

      <AppCard className="p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Account Settings</h2>
            <p className="text-sm text-slate-400 mb-4">
              Manage your account preferences and profile settings.
            </p>

            {profile && (
              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-800">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">College/University</label>
                    <p className="text-sm text-slate-200 mt-1">
                      {profile.college || 'Not set'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">College cannot be changed after signup</p>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-medium touch-manipulation"
            >
              Edit Profile
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Notifications</h2>
            <p className="text-sm text-slate-400">
              Notification settings will be available soon.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Legal & Privacy</h2>
            <div className="space-y-3">
              <Link
                href="/terms"
                className="block text-indigo-400 hover:text-indigo-300 font-medium hover:underline py-2 min-h-[44px] flex items-center"
              >
                📄 Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="block text-indigo-400 hover:text-indigo-300 font-medium hover:underline py-2 min-h-[44px] flex items-center"
              >
                🔒 Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
