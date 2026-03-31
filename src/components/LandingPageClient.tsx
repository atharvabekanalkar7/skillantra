'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { NeuralBackground } from "@/components/ui/flow-field-background";
import { Play, Users, Briefcase, Mail, Layout, UserPlus, TrendingUp, Shield, ArrowRight, MousePointer2, Zap, Rocket, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { showToast } from "@/lib/utils/toast";
import { motion, useScroll, useTransform, useSpring, useMotionValue, Easing } from "framer-motion";
import Image from "next/image";
import { MAINTENANCE_MODE } from "@/config/app";
import useClickSound from "@/hooks/useClickSound";

// --- SUBTLE TILT COMPONENT ---
function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [4, -4]);
  const rotateY = useTransform(x, [-100, 100], [-4, 4]);

  const springConfig = { damping: 20, stiffness: 300 };
  const springX = useSpring(rotateX, springConfig);
  const springY = useSpring(rotateY, springConfig);

  function onMouseMove(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
      className={`relative group transition-all duration-200 transform-gpu hover:scale-[1.02] hover:-translate-y-1 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef(null);

  // Parallax Scroll Effect
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.98]);

  // Global Mouse Follow (Light Effect)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);

    const error = searchParams.get('error');
    if (error === 'only_iit_mandi_allowed') {
      showToast('Only students and staff with IIT Mandi email addresses are allowed on the waitlist.', 'error');
    } else if (error) {
      showToast('Something went wrong during sign-in. Please try again.', 'error');
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [searchParams]);

  const sectionAnimation = {
    initial: { opacity: 0, y: 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.4, ease: "easeOut" as any }
  };

  const divider = (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto max-w-6xl" />
  );

  const playSound = useClickSound();

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* GLOBAL INTERACTIVE BACKGROUND */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-40"
      >
        <div className="opacity-30 md:opacity-100">
          <NeuralBackground
            color="#4f46e5"
            trailOpacity={0.08}
            particleCount={600}
            speed={0.7}
          />
        </div>
        
        {/* Mouse Follow Glow */}
        <motion.div 
          style={{ 
            x: useSpring(mouseX, { damping: 40, stiffness: 200 }), 
            y: useSpring(mouseY, { damping: 40, stiffness: 200 }),
            translateX: "-50%",
            translateY: "-50%"
          }}
          className="absolute w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-screen"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950" />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,8,0.85) 100%)' }}
        />
      </motion.div>

      {/* Main Content Layer */}
      <div className="relative z-10 space-y-0">
        
        {/* --- HERO SECTION (A) --- */}
        <motion.section
          id="hero"
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-8 bg-transparent"
        >
          <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto will-change-transform">
            <motion.p 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase bg-gradient-to-r from-indigo-300 via-indigo-400 to-sky-400 bg-clip-text text-transparent"
            >
              SkillAntra
            </motion.p>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight font-bold text-white [text-wrap:balance]"
            >
              <span className="block">Build Together.</span>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent pb-2 inline-block">
                Grow Together.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-base md:text-lg text-slate-400 max-w-2xl font-medium leading-relaxed"
            >
              The campus platform where students discover internships, exchange skills, and form teams for projects, hackathons, and competitions.
            </motion.p>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs md:text-sm font-medium italic opacity-70">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-indigo-500" />
              <span>Campus-verified only · Priority internship access · Free forever</span>
            </div>

            <div className="flex flex-col items-center gap-6 mt-4 w-full">
              {MAINTENANCE_MODE && (
                <div className="flex h-10 items-center justify-center gap-2 px-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                  <Rocket className="w-4 h-4" />
                  Full Platform Coming Soon
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard?demo=true"
                  onClick={() => playSound()}
                  className="group flex h-12 w-full sm:w-auto sm:min-w-[200px] items-center justify-center gap-3 rounded-xl bg-indigo-600 px-8 font-bold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] text-base will-change-transform shadow-xl shadow-indigo-600/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Explore Demo
                </Link>
                
                <button
                  onClick={() => {
                    playSound();
                    router.push('/join-waitlist');
                  }}
                  className="group relative inline-flex h-12 w-full sm:w-auto sm:min-w-[240px] items-center justify-center gap-2 px-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold transition-all duration-200 ease-out hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97] text-base"
                >
                  Join Waitlist & Get Priority Access!
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {divider}

        {/* --- SECTION 1 - PROBLEM (B) --- */}
        <section className="bg-white/[0.01] backdrop-blur-[2px] py-20 px-4 md:px-8 border-t border-white/5">
          <motion.div {...sectionAnimation} className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Why most students never get <br className="hidden md:block" /> real opportunities early
            </h2>
            <div className="text-slate-400 space-y-4 text-lg font-medium">
              <p>Too many platforms. Too much competition. Too little signal.</p>
              <p>You either compete with thousands — <br className="hidden md:block" /> or struggle to find the right people to build with.</p>
              <p className="text-indigo-400">So you end up waiting instead of building.</p>
            </div>
          </motion.div>
        </section>

        {divider}

        {/* --- SECTION 2 - SOLUTION (C) --- */}
        <section className="bg-gradient-to-b from-transparent to-indigo-950/10 py-20 px-4 md:px-8 border-t border-white/5">
          <TiltCard className="max-w-6xl mx-auto">
            <motion.div 
              {...sectionAnimation}
              className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden group/solution hover:border-white/20 transition-colors shadow-2xl shadow-black/40"
            >
              {/* Radial Glow Follow (Subtle) */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="flex-1 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                    A private campus network <br /> built for doing — not waiting
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-400 text-lg font-medium">SkillAntra connects IIT Mandi students to:</p>
                    <ul className="grid grid-cols-1 gap-3">
                      {[
                        { icon: Users, text: "Real collaborators" },
                        { icon: Layout, text: "Real projects" },
                        { icon: Briefcase, text: "Real opportunities" }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-white font-semibold group/li transition-transform duration-200 hover:translate-x-1">
                          <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover/li:bg-indigo-500/40 transition-colors">
                             <item.icon className="w-3.5 h-3.5" />
                          </div>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                    <p className="text-slate-500 font-medium italic">All inside a verified, closed ecosystem.</p>
                  </div>
                </div>
                
                {/* Logo Section */}
                <div className="w-full md:w-1/4 flex justify-center">
                   <motion.div 
                     animate={{ y: [0, -4, 0] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                     className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl shadow-indigo-500/10 group-hover/solution:scale-110 group-hover/solution:brightness-110 transition-all duration-300"
                   >
                      <div className="relative w-16 h-16 md:w-20 md:h-20">
                        <Image 
                          src="/SkillAntra-Logo.png" 
                          alt="SkillAntra Logo" 
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/solution:opacity-100 blur-2xl rounded-full transition-opacity" />
                   </motion.div>
                </div>
              </div>
            </motion.div>
          </TiltCard>
        </section>

        {divider}

        {/* --- SECTION 3 - CORE VALUE (B) --- */}
        <section className="bg-white/[0.01] backdrop-blur-[2px] py-20 px-4 md:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Users, title: "Build Together", text: "Find people who complement your skills and start working immediately." },
                { icon: Rocket, title: "Execute Faster", text: "Join projects, hackathons, and research without starting from zero." },
                { icon: Briefcase, title: "Access Opportunities", text: "Internships that are relevant, reachable, and within your ecosystem." }
              ].map((card, i) => (
                <TiltCard key={i}>
                  <div className="h-full bg-white/[0.03] border border-white/[0.08] p-8 rounded-3xl space-y-4 hover:border-white/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                      <card.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">{card.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{card.text}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {divider}

        {/* --- SECTION 4 - HOW IT WORKS (A) --- */}
        <section className="bg-transparent py-20 px-4 md:px-8 border-t border-white/5">
          <motion.div {...sectionAnimation} className="max-w-6xl mx-auto text-center space-y-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              From idea → execution, without friction
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-white/10" />
              {[
                { step: "1", title: "Create", desc: "Tell us what you can do or want to build.", icon: UserPlus },
                { step: "2", title: "Connect", desc: "Find collaborators, projects, and opportunities.", icon: MousePointer2 },
                { step: "3", title: "Build", desc: "Work on real things that actually matter.", icon: CheckCircle2 }
              ].map((item, i) => (
                 <motion.div 
                   key={i} 
                   whileHover={{ scale: 1.05 }}
                   className="flex flex-col items-center space-y-6 relative z-10 cursor-default"
                 >
                    <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 font-bold shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:text-white">
                      {item.step}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                      <p className="text-slate-400 text-sm max-w-[200px] mx-auto font-medium">{item.desc}</p>
                    </div>
                 </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {divider}

        {/* --- SECTION 5 - DIFFERENTIATION (B) --- */}
        <section className="bg-white/[0.01] backdrop-blur-[2px] py-16 px-4 md:px-8 border-t border-white/5">
          <motion.div {...sectionAnimation} className="max-w-6xl mx-auto text-center space-y-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Why this is different</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
              {[
                { title: "Not public.", sub: "Only IIT Mandi" },
                { title: "Not noisy.", sub: "Only verified users" },
                { title: "Not random.", sub: "Only relevant opportunities" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
                   <div className="space-y-2 group cursor-default">
                    <p className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{item.title}</p>
                    <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">{item.sub}</p>
                  </div>
                  {i < 2 && <div className="w-px h-12 bg-white/10 hidden md:block" />}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {divider}

        {/* --- SECTION 6 - FINAL CTA (C) --- */}
        <section className="bg-gradient-to-b from-transparent to-indigo-950/20 py-24 px-4 md:px-8 border-t border-white/5">
          <motion.div {...sectionAnimation} className="max-w-6xl mx-auto text-center">
            <div className="bg-gradient-to-tr from-indigo-900/30 to-transparent border border-white/10 rounded-[3.5rem] p-12 md:p-24 space-y-10 relative overflow-hidden group/cta">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#04060F_100%)] opacity-80" />
              
              {/* Animated Accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/[0.02] blur-[150px] rounded-full group-hover/cta:bg-indigo-500/[0.05] transition-all duration-700 pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                  You don’t need <br className="hidden md:block" /> more courses.
                </h2>
                <p className="text-2xl md:text-3xl text-slate-400 font-medium italic tracking-tight">
                  You need better opportunities — earlier.
                </p>
                <div className="pt-8">
                  <button
                    onClick={() => router.push('/join-waitlist')}
                    className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold transition-all duration-300 ease-out hover:bg-white/20 hover:border-white/30 hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.96] text-xl shadow-2xl shadow-indigo-500/10"
                  >
                    Join Waitlist & Get Priority Access!
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pb-10 px-4 md:px-8">
          <div className="max-w-6xl mx-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-5 md:py-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 transition-all hover:border-white/20">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <a href="mailto:sanitocorleone@gmail.com" className="hover:text-indigo-400 transition-colors">sanitocorleone@gmail.com</a>
              </p>
              <div className="hidden md:block w-px h-4 bg-white/10" />
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                &copy; 2026 SkillAntra. Built for IIT Mandi students.
              </p>
            </div>
            
            <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Scroll smoothness style */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
