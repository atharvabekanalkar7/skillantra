import Link from 'next/link';

export default function SettingsPage() {
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Privacy</h2>
            <p className="text-sm text-gray-600">
              Privacy settings will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

