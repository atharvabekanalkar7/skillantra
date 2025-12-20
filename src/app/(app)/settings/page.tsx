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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage your account preferences and profile settings.
            </p>
            
            {profile && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">College/University</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {profile.college || 'Not set'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">College cannot be changed after signup</p>
                  </div>
                </div>
              </div>
            )}
            
            <Link
              href="/profile/edit"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </Link>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h2>
            <p className="text-sm text-gray-600">
              Notification settings will be available soon.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Legal & Privacy</h2>
            <div className="space-y-3">
              <Link
                href="/terms"
                className="block text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                📄 Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="block text-blue-600 hover:text-blue-700 font-medium hover:underline"
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

