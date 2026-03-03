'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { NeuralBackground } from "@/components/ui/flow-field-background";
import { Play, Search, Users, Briefcase, Shield, Users2, Mail } from "lucide-react";

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
    <div className="min-h-screen bg-slate-950 font-sans antialiased overflow-x-hidden">
      {/* Hero Section */}
      <section
        id="hero"
        data-section="hero"
        className="relative w-full min-h-screen"
      >
        <NeuralBackground
          color="#4f46e5"
          trailOpacity={0.08}
          particleCount={600}
          speed={0.7}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
        </div>
        <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex flex-col items-center gap-8 text-center px-4 transition-opacity duration-700 ${mounted ? "opacity-100 animate-fade-in-up" : "opacity-0"}`}>
            <p className="text-sm md:text-base font-semibold tracking-[0.3em] uppercase mb-2 bg-gradient-to-r from-indigo-300 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              SkillAntra
            </p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-100">
              Build Together.
              <span className="block text-indigo-400">Grow Together.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl text-center">
              The campus platform where students find teammates, collaborate on projects, and build portfolios together.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto sm:justify-center">
              <Link
                href="/dashboard?demo=true"
                className="flex min-h-[52px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] text-base touch-manipulation"
              >
                <Play className="w-4 h-4" />
                Demo Mode
              </Link>
              <Link
                href="/signup"
                className="flex min-h-[52px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center rounded-xl border border-slate-700 px-8 py-3.5 font-semibold text-slate-300 transition-all hover:bg-slate-800 active:scale-[0.98] text-base touch-manipulation"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works & Why SkillAntra */}
      <section
        id="features"
        data-section="features"
        className="bg-slate-950 py-24 md:py-32 transition-opacity duration-1000"
      >
        <div className={`relative mx-auto max-w-7xl px-6 transition-opacity duration-1000 ${visibleSections.has('features') ? 'opacity-100' : 'opacity-60'}`}>
          {/* How It Works */}
          <div className={`mb-20 text-center ${visibleSections.has('features') ? 'animate-slide-in-up' : ''}`}>
            <h2 className="text-3xl font-semibold text-slate-100 mb-2">
              How SkillAntra Works
            </h2>
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Three simple steps to start collaborating
            </p>
          </div>

          <div className={`grid gap-6 md:grid-cols-3 mb-24 ${visibleSections.has('features') ? 'animate-fade-in-scale' : ''}`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:bg-slate-800 transition">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-indigo-400 mb-6">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-100">Discover Skills</h3>
              <p className="text-slate-400 leading-relaxed">
                Browse profiles of students on your campus with skills in coding, design, marketing, research, and more.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:bg-slate-800 transition">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-indigo-400 mb-6">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-100">Collaborate</h3>
              <p className="text-slate-400 leading-relaxed">
                Connect with teammates, share ideas, and work together on projects that matter to you.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:bg-slate-800 transition">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-indigo-400 mb-6">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-100">Build Portfolio</h3>
              <p className="text-slate-400 leading-relaxed">
                Gain real-world experience, build your portfolio, and grow your skills through collaboration.
              </p>
            </div>
          </div>

          {/* Why SkillAntra */}
          <div className={`mb-16 text-center ${visibleSections.has('features') ? 'animate-slide-in-up' : ''}`}>
            <h2 className="text-3xl font-semibold text-slate-100 mb-2">
              Why SkillAntra Exists
            </h2>
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Built for students, by students
            </p>
          </div>

          <div className={`grid gap-6 md:grid-cols-2 ${visibleSections.has('features') ? 'animate-fade-in-scale' : ''}`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:bg-slate-800 transition">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-indigo-400 mb-6">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-100">Campus-Focused Trust</h3>
              <p className="text-slate-400 leading-relaxed">
                Unlike generic platforms, SkillAntra connects you with students from your own campus. Trust comes naturally when you're part of the same community.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:bg-slate-800 transition">
              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-indigo-400 mb-6">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-100">Peer Collaboration</h3>
              <p className="text-slate-400 leading-relaxed">
                Work with fellow students who understand your journey. Learn together, build together, and grow together in a supportive environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact: <a href="mailto:skillantra0511@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">skillantra0511@gmail.com</a>
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/terms"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-slate-700">|</span>
              <Link
                href="/privacy"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              &copy; 2025 SkillAntra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
