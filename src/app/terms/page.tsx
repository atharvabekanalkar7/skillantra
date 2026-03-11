import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
                <FileText className="w-6 h-6" strokeWidth={1.5} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Terms of Service
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
                Acceptance of Terms
              </h2>
              <p className="text-slate-400 leading-relaxed">
                By creating an account or using SkillAntra ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">2.</span>
                Eligibility
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra is exclusively available to students and verified recruiters associated with IIT Mandi. Student accounts require a valid @students.iitmandi.ac.in or @iitmandi.ac.in email address. Recruiter accounts are subject to manual verification and approval by the SkillAntra team before access is granted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">3.</span>
                Account Responsibilities
              </h2>
              <p className="text-slate-400 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others. You must provide accurate and truthful information during signup and profile setup. SkillAntra reserves the right to suspend or terminate accounts that violate these terms or provide false information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">4.</span>
                Platform Use
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra is intended for legitimate academic and professional collaboration. You agree not to use the Platform to harass, spam, or harm other users. You agree not to post false, misleading, or fraudulent internship listings or collaboration requests. You agree not to scrape, reverse-engineer, or attempt to access the Platform's backend systems. You agree not to use the Platform for any commercial purpose not explicitly permitted by SkillAntra.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">5.</span>
                Collaboration & Tasks
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Students may post tasks, collaboration requests, and project listings. By posting, you confirm you have the right to seek collaboration on the described work. SkillAntra does not guarantee the quality, completion, or outcome of any collaboration formed on the Platform. Disputes between collaborators are the sole responsibility of the involved parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">6.</span>
                Internships
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Recruiters may post internship opportunities after account verification. SkillAntra does not guarantee employment or internship placement. SkillAntra is not a party to any agreement between a recruiter and a student. All offer letters, completion letters, and related documents are the responsibility of the recruiting company.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">7.</span>
                Messaging & Communications
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Messages sent through SkillAntra are private between participants. SkillAntra does not actively monitor message content but reserves the right to review messages in response to reported violations. Do not share sensitive personal information (passwords, financial details) through the messaging system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">8.</span>
                Intellectual Property
              </h2>
              <p className="text-slate-400 leading-relaxed">
                All content on SkillAntra — including its design, codebase, branding, and UI — is the intellectual property of SkillAntra. User-generated content (profiles, posts, project descriptions) remains owned by the user, but you grant SkillAntra a non-exclusive license to display it on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">9.</span>
                Termination
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra reserves the right to suspend or permanently terminate any account at its discretion, including for violation of these terms, inactivity, or misuse of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">10.</span>
                Disclaimer of Warranties
              </h2>
              <p className="text-slate-400 leading-relaxed">
                SkillAntra is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, error-free operation, or any specific outcome from use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">11.</span>
                Limitation of Liability
              </h2>
              <p className="text-slate-400 leading-relaxed">
                To the maximum extent permitted by law, SkillAntra and its founders shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">12.</span>
                Changes to Terms
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms. Major changes will be communicated via the registered email address.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-800/60 transition-colors">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-baseline">
                <span className="font-mono text-indigo-400 mr-3 text-sm">13.</span>
                Contact
              </h2>
              <p className="text-slate-400 leading-relaxed">
                For questions about these Terms, contact us at{' '}
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


