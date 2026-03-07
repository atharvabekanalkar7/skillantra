'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';

const DURATION_OPTIONS = [
    { value: 2, label: '2 weeks' },
    { value: 4, label: '4 weeks' },
    { value: 6, label: '6 weeks' },
    { value: 8, label: '8 weeks' },
    { value: 12, label: '12 weeks' },
];

export default function NewInternshipPage() {
    const router = useRouter();

    // Core fields
    const [roleTitle, setRoleTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    // Details
    const [durationWeeks, setDurationWeeks] = useState<number | ''>('');
    const [stipendAmount, setStipendAmount] = useState<number | ''>('');
    const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
    const [applyByDate, setApplyByDate] = useState('');
    const [seats, setSeats] = useState<number>(1);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingSubmit, setPendingSubmit] = useState(false);

    // Access control state
    const [isCheckingAccess, setIsCheckingAccess] = useState(true);
    const [isRecruiter, setIsRecruiter] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        async function checkAccess() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('user_type, is_verified')
                .eq('user_id', user.id)
                .single();

            if (profile?.user_type !== 'recruiter') {
                router.push('/dashboard');
                return;
            }

            setIsRecruiter(true);
            setIsVerified(!!profile?.is_verified);
            setIsCheckingAccess(false);
        }

        checkAccess();
    }, [router]);

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newSkill = skillInput.trim();
            if (newSkill && !skillsRequired.includes(newSkill)) {
                setSkillsRequired([...skillsRequired, newSkill]);
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkillsRequired(skillsRequired.filter(s => s !== skillToRemove));
    };

    const validate = (): string | null => {
        if (!roleTitle.trim()) return 'Role Title is required';
        if (!description.trim()) return 'Description is required';
        if (!durationWeeks) return 'Duration is required';
        if (stipendAmount === '' || stipendAmount < 0) return 'Valid Monthly Stipend is required';

        if (applyByDate) {
            const deadline = new Date(applyByDate);
            if (isNaN(deadline.getTime())) return 'Invalid Apply By Date';
            if (deadline.getTime() <= Date.now()) return 'Apply By Date must be in the future';
        }

        if (seats < 1 || seats > 10) return 'Number of seats must be between 1 and 10';

        return null;
    };

    const submitInternship = async (throwOnError: boolean = false) => {
        setLoading(true);
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            if (throwOnError) throw new Error(validationError);
            return;
        }

        try {
            const payload = {
                role_title: roleTitle.trim(),
                description: description.trim(),
                skills_required: skillsRequired,
                duration_weeks: Number(durationWeeks),
                stipend_amount: Number(stipendAmount),
                work_mode: workMode,
                apply_by_date: applyByDate || null,
                seats: Number(seats)
            };

            const response = await fetch('/api/internships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error || 'Failed to post internship';
                setError(errorMsg);
                setLoading(false);
                if (throwOnError) throw new Error(errorMsg);
                return;
            }

            setLoading(false);
            router.push('/internships/mine');
            router.refresh();
        } catch (err: any) {
            const errorMsg = err.message || 'An unexpected error occurred';
            setError(errorMsg);
            setLoading(false);
            if (throwOnError) throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPendingSubmit(true);
        await submitInternship();
        setPendingSubmit(false);
    };

    // Minimum datetime for deadline (now + 5 minutes)
    const getMinDeadline = () => {
        const d = new Date(Date.now() + 5 * 60 * 1000);
        return d.toISOString().slice(0, 16);
    };

    if (isCheckingAccess) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-indigo-500"></div>
            </div>
        );
    }

    // Show full page branch for unverified recruiters
    if (isRecruiter && !isVerified) {
        return (
            <div className="max-w-xl mx-auto opacity-0 animate-fade-in-up mt-12">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center sm:p-12 shadow-[0_18px_45px_rgba(15,23,42,0.7)] backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                    <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">Account Pending Verification</h2>
                    <p className="text-slate-300 mb-8 leading-relaxed">
                        Your recruiter account is currently pending verification. We'll notify you by email once approved. Only verified recruiters can post new internships.
                    </p>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto opacity-0 animate-fade-in-up">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Post an Internship</h1>
                <p className="text-white/80 text-sm sm:text-base">Find top students to build your projects</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Role Title */}
                    <div>
                        <label htmlFor="roleTitle" className="block text-sm font-medium text-white mb-2">
                            Role Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="roleTitle"
                            type="text"
                            value={roleTitle}
                            onChange={(e) => setRoleTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                            placeholder="e.g. Frontend Developer Intern"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                            What will the intern build? <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Describe the actual work, projects, and what they'll ship"
                        />
                    </div>

                    {/* Skills Required */}
                    <div>
                        <label htmlFor="skills" className="block text-sm font-medium text-white mb-2">
                            Skills Required
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {skillsRequired.map((skill, index) => (
                                <div
                                    key={index}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="text-slate-500 hover:text-slate-300 focus:outline-none"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            id="skills"
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                            placeholder="Type a skill and press Enter (e.g. Next.js, Figma)"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Duration */}
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-white mb-2">
                                Duration <span className="text-red-400">*</span>
                            </label>
                            <select
                                id="duration"
                                value={durationWeeks}
                                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                required
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] appearance-none"
                            >
                                <option value="">Select duration</option>
                                {DURATION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Monthly Stipend */}
                        <div>
                            <label htmlFor="stipend" className="block text-sm font-medium text-white mb-2">
                                Monthly Stipend (₹) <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="stipend"
                                type="number"
                                min="0"
                                value={stipendAmount}
                                onChange={(e) => setStipendAmount(e.target.value ? Number(e.target.value) : '')}
                                required
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                                placeholder="e.g., 15000"
                            />
                        </div>
                    </div>

                    {/* Work Mode */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">
                            Work Mode <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {(['Remote', 'Hybrid', 'On-site'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setWorkMode(mode)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-medium focus:outline-none transition-colors border ${workMode === mode
                                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Application Deadline */}
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-white mb-2">
                                Apply By Date <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                            </label>
                            <input
                                id="deadline"
                                type="datetime-local"
                                value={applyByDate}
                                onChange={(e) => setApplyByDate(e.target.value)}
                                min={getMinDeadline()}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] [color-scheme:dark]"
                            />
                        </div>

                        {/* Number of Seats */}
                        <div>
                            <label htmlFor="seats" className="block text-sm font-medium text-white mb-2">
                                Number of seats
                            </label>
                            <input
                                id="seats"
                                type="number"
                                min="1"
                                max="10"
                                value={seats}
                                onChange={(e) => setSeats(Number(e.target.value) || 1)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                            />
                        </div>
                    </div>

                    {/* Fee preview string */}
                    <div className="mt-8 mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            Platform fee on hire: <span className="text-indigo-400 font-semibold">₹{stipendAmount === '' || isNaN(stipendAmount) ? 0 : Math.round(stipendAmount * 0.08).toLocaleString()}</span> <span className="text-slate-400">(8% of monthly stipend)</span><br />
                            <span className="text-slate-500 font-normal">Only charged when you successfully hire a candidate</span>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 sm:py-4 min-h-[44px] border border-slate-700 rounded-lg text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors touch-manipulation font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 min-h-[44px] bg-indigo-600 text-white py-3 sm:py-4 px-6 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] font-semibold touch-manipulation"
                        >
                            {loading ? 'Posting...' : 'Post Internship'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
