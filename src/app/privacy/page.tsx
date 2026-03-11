import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060910] overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="space-y-12">
          <header className="border-b border-slate-800/60 pb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Privacy Policy
              </h1>
            </div>
            <p className="text-slate-400">
              SkillAntra — Last updated: <span className="text-slate-300">March 11, 2026</span>
            </p>
          </header>

          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">1.</span>
                Introduction
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra ("we", "our", "the Platform") is committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights regarding it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">2.</span>
                Data We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-2">Account Data</h3>
                  <p className="text-slate-400 leading-relaxed">
                    When you sign up, we collect your full name, email address, college/university, user type (student or recruiter), and password (stored encrypted via Supabase Auth).
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Profile Data</h3>
                  <p className="text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Students:</strong> skills, role preference (skill holder / skill seeker), bio, year of study, branch, LinkedIn, GitHub, and any portfolio information you choose to add.
                    <br />
                    <strong className="text-slate-300">Recruiters:</strong> company name, company email, phone number, and company description.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Usage Data</h3>
                  <p className="text-slate-400 leading-relaxed">
                    We collect information about how you interact with the Platform, including pages visited, actions taken (e.g. sending requests, applying to internships), and timestamps.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Communication Data</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Messages sent between users on the Platform are stored in our database to enable real-time messaging functionality.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Device & Technical Data</h3>
                  <p className="text-slate-400 leading-relaxed">
                    We may collect IP address, browser type, and device information for security and debugging purposes.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">3.</span>
                How We Use Your Data
              </h2>
              <p className="text-slate-400 leading-relaxed">
                To create and manage your account. To display your profile to other users on the Platform. To facilitate collaboration requests, internship applications, and messaging. To send transactional emails (account confirmation, password reset, recruiter approval notifications) via Resend. To detect and prevent fraudulent or abusive activity. To improve the Platform based on usage patterns.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">4.</span>
                Data Sharing
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We do not sell your personal data. We do not share your data with third parties for marketing purposes. We share data only with: Supabase (our database and authentication provider), Resend (our email delivery provider), and Vercel (our hosting provider). These are infrastructure providers bound by their own privacy policies and data processing agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">5.</span>
                Recruiter Verification
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Recruiter accounts are reviewed manually before approval. During this process, the information provided at signup (company name, email, phone number) is reviewed by the SkillAntra team.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">6.</span>
                Data Retention
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Your data is retained as long as your account is active. If you delete your account, your profile and associated data are permanently deleted from our database within 30 days. Messages may be retained for a short period for abuse prevention purposes before deletion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">7.</span>
                Your Rights
              </h2>
              <p className="text-slate-400 leading-relaxed">
                You have the right to access the personal data we hold about you. You have the right to request correction of inaccurate data. You have the right to request deletion of your account and associated data. You have the right to withdraw consent for data processing at any time by deleting your account. To exercise these rights, contact us at <a href="mailto:sanitocorleone@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">sanitocorleone@gmail.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">8.</span>
                Cookies & Local Storage
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra uses browser local storage and session cookies solely to maintain your authentication state. We do not use tracking cookies or third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">9.</span>
                Security
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We use Supabase's built-in Row Level Security (RLS) to ensure users can only access data they are authorized to view. All data is transmitted over HTTPS. Passwords are never stored in plain text.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">10.</span>
                Children's Privacy
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra is not intended for users under the age of 13. We do not knowingly collect data from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">11.</span>
                Changes to This Policy
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Significant changes will be communicated via email.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-800/60 transition-colors">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">12.</span>
                Contact
              </h2>
              <p className="text-slate-400 leading-relaxed">
                For privacy-related questions or data requests, contact us at{' '}
                <a href="mailto:sanitocorleone@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4">
                  sanitocorleone@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


