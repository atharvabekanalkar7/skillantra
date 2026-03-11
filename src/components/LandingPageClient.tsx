'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { NeuralBackground } from "@/components/ui/flow-field-background";
import { Play, Search, Users, Briefcase, Mail, Layout, UserPlus, TrendingUp, ShieldCheck, ArrowRightLeft, Contact, Folder } from "lucide-react";

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased overflow-x-hidden">
      {/* Fix 3: Persistent Fixed Background */}
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}>
        <div className="opacity-30 md:opacity-100">
          <NeuralBackground
            color="#4f46e5"
            trailOpacity={0.08}
            particleCount={600}
            speed={0.7}
          />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/15 to-slate-950" />
        </div>
        <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />
        {/* Highlight vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,8,0.85) 100%)',
          }}
        />
      </div>

      {/* Main Content Scrollable Layer */}
      <div className="relative z-10 px-4 md:px-8 lg:px-16">
        {/* Hero Section */}
        <section
          id="hero"
          className="min-h-screen flex flex-col items-center justify-center text-center relative w-full"
        >
          <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
            <p className="fade-up text-xs md:text-sm font-semibold tracking-[0.3em] uppercase mb-2 bg-gradient-to-r from-indigo-300 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              SkillAntra
            </p>
            <h1 className="fade-up fade-up-delay-1 text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight font-bold text-slate-100 [text-wrap:balance] overflow-visible">
              <span className="block">Build Together.</span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent pb-2 inline-block">
                Grow Together.
              </span>
            </h1>

            <p className="fade-up fade-up-delay-2 text-base md:text-lg text-slate-400 max-w-2xl text-center leading-relaxed font-medium">
              The campus platform where students discover internships, exchange skills, and form teams for projects, hackathons, and competitions.
            </p>

            {/* CTAs */}
            <div className="fade-up fade-up-delay-3 mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto sm:justify-center">
              <Link
                href="/dashboard?demo=true"
                className="group flex min-h-[52px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center gap-3 rounded-xl bg-indigo-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-[0.98] text-base"
              >
                <Play className="w-4 h-4 fill-current" />
                Demo Mode
              </Link>
              <Link
                href="/signup"
                className="flex min-h-[52px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm px-8 py-3.5 font-bold text-slate-200 transition-all hover:bg-slate-800 hover:border-slate-500 active:scale-[0.98] text-base"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2 — What you can do */}
        <section id="what-you-can-do" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="scroll-reveal text-center mb-16 md:mb-24">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                Everything you need. In one place.
              </h2>
              <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
                Built for the way students actually work
              </p>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
              {/* Card 1 */}
              <div className="scroll-reveal group bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all duration-300 hover:translate-y-[-4px] hover:border-indigo-500/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-6 font-semibold">
                  <Users className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">1-on-1 Collaboration</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Connect directly with a peer who has the skill you need. Send a request, get accepted, start working. Like LinkedIn connections — but for building things together.
                </p>
              </div>

              {/* Card 2 */}
              <div className="scroll-reveal group bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all duration-300 hover:translate-y-[-4px] hover:border-violet-500/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 mb-6 font-semibold">
                  <Layout className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">Team Projects & Competitions</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Form or join teams for hackathons, research projects, competitions, and semester projects. Post what you're building and find people who want in.
                </p>
              </div>

              {/* Card 3 */}
              <div className="scroll-reveal group bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all duration-300 hover:translate-y-[-4px] hover:border-indigo-500/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-6 font-semibold">
                  <Briefcase className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">Campus Internships</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Recruiters post real internship opportunities exclusively for IIT Mandi students. Apply, get shortlisted, receive offer letters — all on platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 — How it works */}
        <section id="how-it-works" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="scroll-reveal text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                How SkillAntra Works
              </h2>
              <p className="text-sm md:text-base text-slate-400">
                Three steps to go from idea to execution
              </p>
            </div>

            <div className="relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-indigo-500/20" />

              <div className="flex flex-col md:flex-row gap-12 relative">
                {/* Step 1 */}
                <div className="scroll-reveal flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#0d1320] border-2 border-indigo-500/20 mb-8 relative z-10">
                    <span className="text-2xl font-mono font-bold text-indigo-500">1</span>
                  </div>
                  <div className="mb-4 text-indigo-400">
                    <UserPlus className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">Create your profile</h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed lg:pr-8">
                    Set your skills, role preference (skill holder or seeker), and what you're looking to build.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="scroll-reveal flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#0d1320] border-2 border-indigo-500/20 mb-8 relative z-10">
                    <span className="text-2xl font-mono font-bold text-indigo-500">2</span>
                  </div>
                  <div className="mb-4 text-indigo-400">
                    <Search className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">Discover & Connect</h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed lg:pr-8">
                    Browse students, send collaboration requests, or apply to internships posted by verified campus recruiters.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="scroll-reveal flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#0d1320] border-2 border-indigo-500/20 mb-8 relative z-10">
                    <span className="text-2xl font-mono font-bold text-indigo-500">3</span>
                  </div>
                  <div className="mb-4 text-indigo-400">
                    <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">Build & Grow</h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                    Work together, complete projects, and build a portfolio that reflects real experience — not just coursework.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 — Why SkillAntra */}
        <section id="why-skillantra" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="scroll-reveal text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                Why SkillAntra Exists
              </h2>
              <p className="text-sm md:text-base text-slate-400">
                Built for students, by students
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {/* Grid Card 1 */}
              <div className="scroll-reveal bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all hover:bg-[#111827] group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Campus-Verified Trust</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Every account is tied to an @iitmandi.ac.in email. No outsiders, no noise — just your campus community.
                </p>
              </div>

              {/* Grid Card 2 */}
              <div className="scroll-reveal bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all hover:bg-[#111827] group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 mb-6 group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Skill Exchange</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Don't just find teammates. Find people to learn from. Trade skills, mentor each other, grow together.
                </p>
              </div>

              {/* Grid Card 3 */}
              <div className="scroll-reveal bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all hover:bg-[#111827] group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                  <Contact className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Real Recruiter Access</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Verified campus recruiters post internships directly to students. No middlemen, no job boards.
                </p>
              </div>

              {/* Grid Card 4 */}
              <div className="scroll-reveal bg-[#0d1320] border border-[#1a2236] rounded-2xl p-8 transition-all hover:bg-[#111827] group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 mb-6 group-hover:scale-110 transition-transform">
                  <Folder className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Portfolio That Proves It</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                  Every collaboration and project you do on SkillAntra builds your visible campus portfolio automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-[#1a2236] mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left">
                <p className="text-sm md:text-base text-slate-400 flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  Contact: <a href="mailto:sanitocorleone@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-medium ml-1">sanitocorleone@gmail.com</a>
                </p>
              </div>
              <div className="flex items-center gap-8 text-sm font-medium">
                <Link
                  href="/terms"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <span className="text-slate-800 text-lg">|</span>
                <Link
                  href="/privacy"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-[#1a2236]/30 text-center">
              <p className="text-slate-500 text-xs md:text-sm tracking-wide">
                &copy; 2026 SkillAntra. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
