import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/80 text-sm sm:text-base">Manage your account settings</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-purple-400/30">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Account Settings</h2>
            <p className="text-sm text-white/70 mb-4">
              Manage your account preferences and profile settings.
            </p>
            
            {profile && (
              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-purple-400/20">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wide">College/University</label>
                    <p className="text-sm text-white mt-1">
                      {profile.college || 'Not set'}
                    </p>
                    <p className="text-xs text-white/50 mt-1">College cannot be changed after signup</p>
                  </div>
                </div>
              </div>
            )}
            
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all active:scale-[0.98] font-semibold touch-manipulation"
            >
              Edit Profile
            </Link>
          </div>

          <div className="pt-6 border-t border-purple-400/20">
            <h2 className="text-lg font-semibold text-white mb-2">Notifications</h2>
            <p className="text-sm text-white/70">
              Notification settings will be available soon.
            </p>
          </div>

          <div className="pt-6 border-t border-purple-400/20">
            <h2 className="text-lg font-semibold text-white mb-2">Legal & Privacy</h2>
            <div className="space-y-3">
              <Link
                href="/terms"
                className="block text-purple-300 hover:text-purple-200 font-medium hover:underline py-2 min-h-[44px] flex items-center"
              >
                📄 Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="block text-purple-300 hover:text-purple-200 font-medium hover:underline py-2 min-h-[44px] flex items-center"
              >
                🔒 Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
