import DashboardLayout from "../components/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white">Account</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  defaultValue="john.doe@students.iitmandi.ac.in"
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
                />
              </div>
              <button className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Email notifications</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Task updates</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-300">New messages</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </label>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white">Privacy</h2>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Show profile to others</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Allow direct messages</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-800 bg-red-900/10 p-6">
            <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
            <p className="mt-2 text-sm text-gray-400">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="mt-4 rounded-lg border border-red-600 bg-red-600/20 px-6 py-2 font-medium text-red-400 hover:bg-red-600/30">
            Delete Account
          </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

