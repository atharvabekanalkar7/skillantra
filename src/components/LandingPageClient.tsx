'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Make hero visible immediately
    setVisibleSections((prev) => new Set(prev).add('hero'));

    const observerOptions = {
      root: null,
      rootMargin: '-5% 0px -5% 0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(entry.target.id));
        }
      });
    }, observerOptions);

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section) => {
        observer.observe(section);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [mounted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 via-blue-950 to-indigo-950 font-sans antialiased overflow-x-hidden">
      {/* Hero Section - Centered */}
      <section 
        ref={heroRef}
        id="hero"
        data-section="hero"
        className="relative min-h-screen overflow-x-hidden overflow-y-visible"
      >
        {/* Colorful animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl animate-pulse"></div>
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-3xl animate-pulse delay-500"></div>
          <div className="absolute right-1/3 top-1/3 h-80 w-80 rounded-full bg-indigo-500/12 blur-3xl animate-pulse delay-700"></div>
          <div className="absolute left-1/3 bottom-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse delay-300"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
        </div>
        {/* Colorful gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 md:py-32">
          <div className={`flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <div className={`flex flex-col items-center gap-8 ${mounted ? "animate-fade-in-up" : ""}`}>
              {/* Brand Name - Prominent */}
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl xl:text-8xl">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl [text-shadow:0_0_40px_rgba(59,130,246,0.3)]">
                  SkillAntra
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Where skills meet opportunity
              </p>

              {/* Main Headline */}
              <h2 className="max-w-5xl text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-white lg:text-5xl xl:text-6xl 2xl:text-7xl">
                Connect with skilled students.{" "}
                <span className="block mt-3 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                  Build real projects.
                </span>
              </h2>

              {/* Supporting Description */}
              <p className="max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-white/90 md:text-xl lg:text-2xl">
                The campus platform where students find teammates, collaborate on projects, and build portfolios together.
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full sm:w-auto sm:justify-center">
              <Link
                href="/dashboard?demo=true"
                className="group flex min-h-[48px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-8 py-4 font-bold text-slate-900 shadow-2xl shadow-amber-900/50 transition-all duration-300 active:scale-[0.98] md:hover:scale-105 md:hover:from-amber-400 md:hover:via-yellow-400 md:hover:to-amber-500 hover:shadow-amber-900/60 text-base sm:text-lg touch-manipulation"
              >
                <span 
                  className="inline-block animate-bounce mr-3 text-2xl" 
                  style={{ 
                    animationDuration: '1.5s', 
                    animationIterationCount: 'infinite',
                    filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 12px rgba(255, 165, 0, 0.6))',
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.9), 0 0 20px rgba(255, 165, 0, 0.7)'
                  }}
                >
                  🚀
                </span>
                Try Demo
              </Link>
              <Link
                href="/signup"
                className="group flex min-h-[48px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center rounded-xl bg-white px-8 py-4 font-bold text-indigo-700 shadow-2xl shadow-indigo-900/30 transition-all duration-300 active:scale-[0.98] md:hover:scale-105 hover:bg-indigo-50 hover:shadow-indigo-900/40 text-base sm:text-lg touch-manipulation"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Combined Section: How It Works & Why SkillAntra */}
      <section 
        ref={sectionRef}
        id="features"
        data-section="features"
        className="relative bg-gradient-to-b from-slate-950 via-indigo-950 via-purple-950 to-slate-950 py-32 transition-opacity duration-1000"
      >
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse"></div>
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className={`relative mx-auto max-w-7xl px-6 transition-opacity duration-1000 ${visibleSections.has('features') ? 'opacity-100' : 'opacity-60'}`}>
          {/* How It Works Section */}
          <div className={`mb-24 text-center ${visibleSections.has('features') ? 'animate-slide-in-up' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold lg:text-6xl xl:text-7xl mb-4">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 via-orange-400 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl [text-shadow:0_0_40px_rgba(251,191,36,0.5)]">
                How SkillAntra Works
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 lg:text-2xl">
              Three simple steps to start collaborating
            </p>
          </div>

          <div className={`grid gap-8 md:grid-cols-3 mb-32 ${visibleSections.has('features') ? 'animate-fade-in-scale' : ''}`}>
            {/* Card 1 */}
            <div className="group relative rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-xl p-6 sm:p-10 transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="mb-6 text-5xl">📚</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Discover Skills</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                Browse profiles of students on your campus with skills in coding, design, marketing, research, and more.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-xl p-6 sm:p-10 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="mb-6 text-5xl">🤝</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Collaborate</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                Connect with teammates, share ideas, and work together on projects that matter to you.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-xl p-6 sm:p-10 transition-all duration-300 hover:border-purple-500/50 hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="mb-6 text-5xl">⚡</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Build Portfolio</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                Gain real-world experience, build your portfolio, and grow your skills through collaboration.
              </p>
            </div>
          </div>

          {/* Why SkillAntra Section */}
          <div className={`mb-20 text-center ${visibleSections.has('features') ? 'animate-slide-in-up delay-400' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold lg:text-6xl xl:text-7xl mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl [text-shadow:0_0_40px_rgba(147,51,234,0.4)]">
                Why SkillAntra Exists
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 lg:text-2xl">
              Built for students, by students
            </p>
          </div>

          <div className={`grid gap-8 md:grid-cols-2 ${visibleSections.has('features') ? 'animate-fade-in-scale delay-600' : ''}`}>
            <div className="rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-xl p-6 sm:p-10 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="mb-6 text-5xl">🏫</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Campus-Focused Trust</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                Unlike generic platforms, SkillAntra connects you with students from your own campus. Trust comes naturally when you're part of the same community.
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-xl p-6 sm:p-10 transition-all duration-300 hover:border-purple-500/50 hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="mb-6 text-5xl">🤝</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Peer Collaboration</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                Work with fellow students who understand your journey. Learn together, build together, and grow together in a supportive environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-gradient-to-b from-slate-950 to-black py-12 border-t border-purple-500/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-white/80 text-sm mb-2">
                📧 Contact: <a href="mailto:skillantra0511@gmail.com" className="text-purple-300 hover:text-purple-200 underline">skillantra0511@gmail.com</a>
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/terms"
                className="text-white/80 hover:text-white transition-colors underline"
              >
                Terms of Service
              </Link>
              <span className="text-white/40">|</span>
              <Link
                href="/privacy"
                className="text-white/80 hover:text-white transition-colors underline"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              © 2025 SkillAntra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

