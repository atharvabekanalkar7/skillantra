'use client';

import { createClient } from '@/lib/supabase/client';
import { Shield, Briefcase, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function JoinWaitlistPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="h-screen bg-[#04060F] text-slate-200 flex items-center justify-center overflow-hidden selection:bg-indigo-500/30 p-4 md:p-8">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4f46e5_1px,_transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 lg:gap-16 z-10 h-full md:h-auto overflow-y-auto md:overflow-visible no-scrollbar">
        
        {/* Back Button - Fixed position mobile/desktop */}
        <Link 
          href="/"
          className="md:absolute md:-top-16 md:left-0 p-2 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all z-20 group mb-4 md:mb-0 shrink-0 self-start"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>

        {/* Left Side: Value Prop */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 md:space-y-8 py-4 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 md:space-y-6"
          >
            {/* Logo Fix: Use next/image with absolute path */}
            <div className="relative w-32 md:w-40 h-10 md:h-12 mb-2">
              <Image 
                src="/SkillAntra-Logo.png" 
                alt="SkillAntra Logo" 
                fill
                className="object-contain object-left"
                priority
              />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Join IIT Mandi’s <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Private Talent Network</span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-400 max-w-md leading-relaxed font-medium">
              Exclusively for IIT Mandi students. Discover verified internships and build projects with your campus community.
            </p>

            <div className="space-y-3 max-w-sm">
              {[
                { icon: Shield, title: "Campus-Verified", desc: "Access restricted to @iitmandi emails." },
                { icon: Briefcase, title: "Priority Internships", desc: "First-in-line access to top roles." },
                { icon: Zap, title: "Quick Collaboration", desc: "Find research & project partners instantly." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Action Area */}
        <div className="w-full md:w-1/2 flex items-center justify-center py-4 md:py-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[400px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-[2rem] p-6 md:p-10 flex flex-col items-center text-center space-y-6 md:space-y-10 shadow-2xl shadow-black/50 overflow-hidden relative"
          >
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-indigo-500/[0.03] to-transparent pointer-events-none" />
            
            <div className="space-y-2 relative">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Reserve your spot</h2>
              <p className="text-slate-500 text-xs md:text-sm">One-click registration for IIT Mandi students.</p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full group relative h-12 md:h-14 px-6 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-white/5"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continue with Google
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-relaxed relative">
              By joining, you agree to our <Link href="/terms" className="underline hover:text-slate-300">Terms</Link> and <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>. Access for active IIT Mandi emails only.
            </p>

            <div className="pt-6 md:pt-10 flex items-center justify-center gap-8 border-t border-white/[0.05] w-full relative">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">IIT Mandi</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">Exclusive</span>
              </div>
              <div className="w-px h-6 bg-white/[0.1]" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Early Access</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">Waitlist</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global CSS for no-scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
