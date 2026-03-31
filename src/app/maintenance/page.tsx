'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight, Play } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
             <Image src="/SkillAntra-Logo.png" alt="SkillAntra" fill className="object-contain p-4" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
             <Rocket className="w-3.5 h-3.5" />
             Early Access
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
             Preparing something <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">great 🚀</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
             SkillAntra is currently in early access. <br className="hidden md:block" />
             You can explore the demo or join the waitlist to get priority access when we launch.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard?demo=true"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
               <Play className="w-4 h-4 fill-current" />
               Explore Demo
            </Link>
            <Link 
              href="/join-waitlist"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20"
            >
               Join Waitlist
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer copyright */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
         <p className="text-slate-600 text-sm">© 2026 SkillAntra. All rights reserved.</p>
      </div>
    </div>
  );
}
