import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all mb-8"
        >
          <span>←</span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-purple-400/30">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">🔒 Privacy Policy</h1>
          <p className="text-white/60 mb-8">Last updated: 21-12-2025</p>

          <div className="prose prose-invert max-w-none space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">SkillAntra collects only the information required to operate the platform.</p>
              <p className="mb-2 font-semibold">Information you provide:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Name</li>
                <li>College</li>
                <li>Skills and profile details</li>
                <li>Phone number (mandatory)</li>
              </ul>
              <p className="mb-2 font-semibold">Automatically collected:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Authentication and session information</li>
                <li>Basic in-app usage data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and manage user accounts</li>
                <li>Enable task posting and applications</li>
                <li>Facilitate collaboration between SkillSeekers and SkillHolders</li>
                <li>Maintain platform security and functionality</li>
              </ul>
              <p className="mt-4 font-semibold">We do not sell user data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Phone Number Privacy</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Phone numbers are never publicly visible.</li>
                <li>A user's phone number is shared only after a task application is accepted.</li>
                <li>Phone numbers are visible only to the SkillSeeker and SkillHolder involved in that task.</li>
                <li>SkillAntra does not use phone numbers for marketing purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
              <p className="mb-4">SkillAntra does not share personal data with third parties, except:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>When required by law</li>
                <li>To maintain platform infrastructure and security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p>We take reasonable steps to protect user data. However, no system is completely secure, and users share information at their own risk.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
              <p>User data is retained as long as the account exists. Account deletion functionality may be added in the future.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies & Authentication</h2>
              <p className="mb-4">SkillAntra uses cookies and local storage to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain secure login sessions</li>
                <li>Enable authentication and authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
              <p>SkillAntra is not intended for users under the age of 13.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p>This Privacy Policy may be updated as SkillAntra evolves. Continued use of the platform implies acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
              <p>For privacy-related questions, contact:</p>
              <p className="mt-2">
                📧 <a href="mailto:skillantra0511@gmail.com" className="text-purple-300 hover:text-purple-200 underline">skillantra0511@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

