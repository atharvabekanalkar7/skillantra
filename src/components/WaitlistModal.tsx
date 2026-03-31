import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ArrowRight, Loader2, Phone, Sparkles, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTERESTS = [
  'Internships',
  'Research',
  'Project Collaboration',
  'All of the above'
];

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Get user on open
      const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUser(data.user);
          // Pre-fill phone if available from metadata or db?
        }
      };
      getUser();
    } else {
      document.body.style.overflow = '';
      if (isSuccess) {
        setStep(1);
        setIsSuccess(false);
      }
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isSuccess]);

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!user?.email) throw new Error('User not identified');

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Waitlist User',
          email: user.email,
          phone,
          college: 'IIT Mandi',
          interests: selectedInterests
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist');
      setPosition(data.position);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interest === 'All of the above') {
      setSelectedInterests(['All of the above']);
    } else {
      setSelectedInterests(prev => {
        const filtered = prev.filter(i => i !== 'All of the above');
        if (filtered.includes(interest)) {
          return filtered.filter(i => i !== interest);
        } else {
          return [...filtered, interest];
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#04060F]/95 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full h-full md:h-auto md:max-w-5xl md:m-4 bg-[#04060F] border-0 md:border md:border-slate-800/50 md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white transition-colors z-[110]"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Side: Value Prop - Hidden on Mobile */}
        <div className="hidden md:flex md:w-2/5 p-12 bg-gradient-to-br from-indigo-900/20 to-transparent flex-col justify-center border-r border-slate-800/50">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Join the Waitlist</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Be first in line for verified internships and collaboration opportunities — exclusively for your campus.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                "Priority access to verified paid internships",
                "Find research & project collaborators on campus",
                "Zero spam. Zero scam listings.",
                "Launching first at IIT Mandi"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-indigo-500 mt-1">✦</span>
                  <p className="text-slate-300 font-medium">{item}</p>
                </div>
              ))}
            </div>

            {user && (
              <div className="pt-6 border-t border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Signed in as</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                    {user.email?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200 truncate max-w-[150px]">{user.user_metadata?.full_name || 'Verified User'}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{user.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center overflow-y-auto pt-20 md:pt-12">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">You're on the list! 🎉</h3>
              <p className="text-slate-400 text-lg mb-8">
                Welcome to the SkillAntra community. <br />
                You're <span className="text-indigo-400 font-bold">#{position}</span> on the waitlist.
              </p>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Back to Homepage
              </button>
            </motion.div>
          ) : (
            <div className="max-w-md mx-auto w-full space-y-8">
              {!user ? (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
                    <div className="inline-flex p-4 rounded-full bg-indigo-500/10 mb-2">
                       <LogIn className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Let's get started</h3>
                    <p className="text-slate-400">Sign in with your Google account to join the waitlist.</p>
                    <button 
                      onClick={async () => {
                        await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                          },
                        });
                      }}
                      className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-slate-100"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/>
                      </svg>
                      Sign In with Google
                    </button>
                    {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                 </motion.div>
              ) : (
                <>
                  {/* Step indicator */}
                  <div className="flex gap-2">
                    {[1, 2].map((s) => (
                      <div 
                        key={s} 
                        className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-indigo-500' : 'bg-slate-800'}`} 
                      />
                    ))}
                  </div>

                  {/* Form Content */}
                  <div className="min-h-[300px]">
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Phone className="w-6 h-6 text-indigo-500" />
                            Phone Number (optional)
                          </h3>
                          <p className="text-slate-400">For priority internship alerts only</p>
                        </div>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="+91 XXXXX XXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button 
                          onClick={() => setStep(2)}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          Continue <ArrowRight className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-500" />
                            What are you looking for?
                          </h3>
                          <p className="text-slate-400">Select all that apply</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {INTERESTS.map((interest) => (
                            <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              className={`px-6 py-3 rounded-full border transition-all font-medium ${
                                selectedInterests.includes(interest)
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                              }`}
                            >
                              {interest}
                            </button>
                          ))}
                        </div>
                        
                        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                        <div className="pt-4 space-y-4">
                          <button 
                            onClick={handleSubmit}
                            disabled={isLoading || selectedInterests.length === 0}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                          >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reserve My Spot →'}
                          </button>
                          <button 
                            onClick={() => setStep(1)}
                            className="w-full text-slate-500 text-sm font-medium hover:text-slate-400"
                          >
                            ← Back
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
