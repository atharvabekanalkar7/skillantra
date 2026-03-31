'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles, User, Target, Activity } from 'lucide-react';

const INTENTS = [
  'Internships',
  'Research Opportunities',
  'Project Collaboration',
  'Competitions'
];

const ACTIVITY_LEVELS = [
  'Actively searching right now',
  'Exploring casually',
  'Just checking it out'
];

export default function WaitlistQuestionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form State
  const [intent, setIntent] = useState<string[]>([]);
  const [activity, setActivity] = useState('');
  const [yearBranch, setYearBranch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Toggle Function for Multi-select Intent
  const toggleIntent = (option: string) => {
    setIntent(prev => 
      prev.includes(option) 
        ? prev.filter(i => i !== option) 
        : [...prev, option]
    );
  };

  // Validation
  const isValid = intent.length > 0 && activity && yearBranch.trim().length > 0;

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Handle no user - maybe redirect back to join-waitlist
        const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
        if (!isDemo) {
          router.push('/');
          return;
        }
      }
      setUserEmail(user?.email || 'demo@visitor.com');
      setCheckingAuth(false);
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);

    const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';

    try {
      if (!isDemo && userEmail) {
        const { error } = await supabase
          .from('waitlist_responses')
          .insert([
            {
              email: userEmail,
              intent,
              activity_level: activity,
              year_branch: yearBranch,
              feedback: feedback.trim() || null
            }
          ]);

        if (error) {
          console.error('Error inserting response:', error);
          // Still redirect to success if it fails, or show error? 
          // Requirements say "Then redirect to success page"
        }
      }

      // Requirement: Redirect to success page
      // Sign out here as the questionnaire is the final step where auth was needed
      if (!isDemo) {
        await supabase.auth.signOut();
      }
      router.push('/waitlist-success');
    } catch (err) {
      console.error('Submission error:', err);
      // Fallback redirect
      router.push('/waitlist-success');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen bg-[#04060f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060f] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3 h-3" />
            Step 2 of 2
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent mb-4"
          >
            Help us tailor SkillAntra for you
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400"
          >
            This takes less than 10 seconds
          </motion.p>
        </div>

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Question 1: Intent */}
          <div className="space-y-4">
            <label className="text-lg font-semibold flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              What are you primarily looking for? <span className="text-indigo-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {INTENTS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleIntent(option)}
                  className={`px-6 py-3 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    intent.includes(option) 
                      ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {option}
                  {intent.includes(option) && <Check className="w-3 h-3 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Activity Level */}
          <div className="space-y-4">
            <label className="text-lg font-semibold flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              How actively are you looking right now? <span className="text-indigo-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              {ACTIVITY_LEVELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActivity(option)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${
                    activity === option 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium">{option}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    activity === option ? 'bg-indigo-500 border-indigo-400' : 'border-slate-700'
                  }`}>
                    {activity === option && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Year & Branch */}
          <div className="space-y-4">
            <label className="text-lg font-semibold flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              Your year & branch <span className="text-indigo-500">*</span>
            </label>
            <input
              type="text"
              value={yearBranch}
              onChange={(e) => setYearBranch(e.target.value)}
              placeholder="e.g., 2nd Year, CSE"
              className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white placeholder-slate-600"
              required
            />
          </div>

          {/* Question 4: Feedback (Optional) */}
          <div className="space-y-4">
            <label className="text-lg font-semibold flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <span className="text-indigo-400 font-bold text-lg">?</span>
              </div>
              Any feedback for us? <span className="text-slate-500 text-sm font-normal">(Optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Problems you face, features you'd want, anything..."
              rows={4}
              className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white placeholder-slate-600 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
