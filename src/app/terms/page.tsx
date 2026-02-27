import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-3 min-h-[44px] rounded-lg transition-all mb-8 touch-manipulation"
        >
          <span>←</span>
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 md:p-12 border border-purple-400/30">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">📄 Terms of Service</h1>
          <p className="text-white/60 mb-8">Last updated: 21-12-2025</p>

          <div className="prose prose-invert max-w-none space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. About SkillAntra</h2>
              <p className="mb-4">
                SkillAntra is a campus-first platform that helps students collaborate on real projects by connecting students who need skills with students who have skills.
              </p>
              <p className="mb-4">Users on SkillAntra participate in one or more of the following roles:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>SkillSeeker:</strong> A student who posts a task or project and is looking for collaborators with specific skills.</li>
                <li><strong>SkillHolder:</strong> A student who possesses certain skills and applies to work on tasks posted by others.</li>
              </ul>
              <p className="mb-4">A user may act as both a SkillSeeker and a SkillHolder.</p>
              <p>SkillAntra is currently in an early/beta stage and is intended for educational and collaborative purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
              <p className="mb-4">To use SkillAntra, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be a student or recent graduate</li>
                <li>Provide accurate and truthful information</li>
                <li>Use the platform responsibly and respectfully</li>
              </ul>
              <p className="mt-4">SkillAntra may restrict access to specific institutions as the platform evolves.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are responsible for maintaining the security of your account.</li>
                <li>You must not impersonate others or provide false information.</li>
                <li>Each user may maintain only one account.</li>
                <li>SkillAntra reserves the right to suspend or terminate accounts that violate these terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Tasks, Applications & Collaboration</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SkillSeekers may post tasks or projects.</li>
                <li>SkillHolders may apply to tasks that match their skills.</li>
                <li>SkillAntra does not guarantee the quality, completion, or outcome of any collaboration.</li>
                <li>All collaborations occur directly between users. SkillAntra is not responsible for disputes, losses, or outcomes resulting from collaborations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Phone Number & Contact</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Providing a valid phone number is mandatory to use SkillAntra.</li>
                <li>Phone numbers are required so that SkillSeekers and SkillHolders can contact each other after a task application is accepted.</li>
                <li>Phone numbers are not publicly visible.</li>
                <li>A phone number is shared only after a task application is accepted, and only between the matched SkillSeeker and SkillHolder.</li>
                <li>SkillAntra does not monitor or mediate communication that occurs outside the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Acceptable Use</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Harass, abuse, or spam other users</li>
                <li>Post misleading, illegal, or harmful content</li>
                <li>Use SkillAntra for scams or commercial spam</li>
                <li>Attempt to exploit or disrupt the platform</li>
              </ul>
              <p className="mt-4">Violations may result in account suspension or removal.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Demo Mode</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SkillAntra may provide a demo mode for exploration purposes.</li>
                <li>Demo mode does not reflect real user data.</li>
                <li>Actions taken in demo mode may not be saved.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Platform Availability</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SkillAntra is provided on an "as-is" basis.</li>
                <li>We do not guarantee uninterrupted availability.</li>
                <li>Features may change, be added, or be removed at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              <p className="mb-4">SkillAntra is not liable for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Disputes between users</li>
                <li>Missed opportunities or project outcomes</li>
                <li>Any communication or interaction outside the platform</li>
              </ul>
              <p className="mt-4">Use SkillAntra at your own discretion.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to These Terms</h2>
              <p>These Terms may be updated from time to time. Continued use of SkillAntra implies acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
              <p>For questions regarding these Terms, contact:</p>
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

