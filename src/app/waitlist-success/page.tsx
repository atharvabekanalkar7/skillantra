'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Rocket, Briefcase, Shield, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WaitlistSuccessPage() {
  return (
    <div className="h-screen bg-[#04060F] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Success Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl rounded-3xl p-8 md:p-10 text-center shadow-2xl shadow-black/20 relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center relative">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -top-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg"
            >
              <Rocket className="w-3 h-3" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            You're on the list 🚀
          </h1>
          <p className="text-base text-slate-400 font-medium max-w-sm mx-auto">
            Early access secured for IIT Mandi’s private talent network.
          </p>
        </div>

        {/* Benefits Tiles - Compact Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
           {[
             { icon: Briefcase, title: "Internships" },
             { icon: Shield, title: "Verified" },
             { icon: Zap, title: "Projects" }
           ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
                  <item.icon className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{item.title}</h3>
              </div>
           ))}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Link
            href="/"
            className="w-full max-w-sm px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group flex items-center justify-center gap-2 text-sm"
          >
            Back to Homepage
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-500 text-xs font-medium max-w-[280px] mx-auto leading-relaxed"
          >
            We'll notify you via your student email when your spot is ready.
          </motion.p>
        </div>
      </motion.div>

      {/* Global CSS for view-height lock */}
      <style jsx global>{`
        body { overflow: hidden; }
      `}</style>
    </div>
  );
}
