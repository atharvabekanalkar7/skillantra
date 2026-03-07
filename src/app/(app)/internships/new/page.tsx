'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';

const DURATION_OPTIONS = [
    { value: 1, label: '1 month' },
    { value: 2, label: '2 months' },
    { value: 3, label: '3 months' },
    { value: 4, label: '4 months' },
    { value: 5, label: '5 months' },
    { value: 6, label: '6 months' },
];

const PREDEFINED_PERKS = ['Certificate', 'Letter of Recommendation', 'Flexible Hours', '5 Days a Week'];

type QuestionType = 'short_text' | 'long_text' | 'yes_no' | 'file_upload';
import { useDemoGuard } from '@/lib/utils/useDemoGuard';

interface Question {
    id: string;
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
}

export default function NewInternshipPage() {
    const router = useRouter();

    // Core fields
    const [title, setTitle] = useState('');
    const [isRemote, setIsRemote] = useState(true);
    const [locationCity, setLocationCity] = useState('');

    const [startImmediately, setStartImmediately] = useState(true);
    const [startDate, setStartDate] = useState('');

    const [durationMonths, setDurationMonths] = useState<number | ''>('');
    const [applyByDate, setApplyByDate] = useState('');
    const [numberOfOpenings, setNumberOfOpenings] = useState<number>(1);

    const [isUnpaid, setIsUnpaid] = useState(false);
    const [stipendMin, setStipendMin] = useState<number | ''>('');
    const [stipendMax, setStipendMax] = useState<number | ''>('');
    const [targetDegree, setTargetDegree] = useState<'both' | 'ug' | 'pg'>('both');

    const [aboutInternship, setAboutInternship] = useState('');
    const [whoCanApply, setWhoCanApply] = useState('');

    // Skills
    const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    // Perks
    const [perks, setPerks] = useState<string[]>([]);
    const [customPerkInput, setCustomPerkInput] = useState('');

    const [isLinkedinMandatory, setIsLinkedinMandatory] = useState(false);

    // Custom Questions
    const [questions, setQuestions] = useState<Question[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handlePerkToggle = (perk: string) => {
        if (perks.includes(perk)) {
            setPerks(perks.filter(p => p !== perk));
        } else {
            setPerks([...perks, perk]);
        }
    };

    const handleCustomPerkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newPerk = customPerkInput.trim();
            if (newPerk && !perks.includes(newPerk)) {
                setPerks([...perks, newPerk]);
            }
            setCustomPerkInput('');
        }
    };

    const removePerk = (perkToRemove: string) => {
        setPerks(perks.filter(p => p !== perkToRemove));
    };

    const addQuestion = () => {
        if (questions.length >= 5) return;
        setQuestions([
            ...questions,
            {
                id: Math.random().toString(36).substring(7),
                question_text: '',
                question_type: 'short_text',
                is_required: true
            }
        ]);
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const validate = (): string | null => {
        if (!title.trim()) return 'Title is required';
        if (!isRemote && !locationCity.trim()) return 'City is required for non-remote internships';
        if (!startImmediately && !startDate) return 'Start date is required';
        if (!durationMonths) return 'Duration is required';

        if (!isUnpaid) {
            if (stipendMin === '') return 'Minimum stipend is required for paid internships';
            if (stipendMax !== '' && Number(stipendMax) < Number(stipendMin)) {
                return 'Maximum stipend cannot be less than minimum stipend';
            }
        }

        if (!aboutInternship.trim()) return 'About Internship is required';
        if (!whoCanApply.trim()) return 'Who can apply is required';

        if (applyByDate) {
            const deadline = new Date(applyByDate);
            if (isNaN(deadline.getTime())) return 'Invalid Apply By Date';
            if (deadline.getTime() <= Date.now()) return 'Apply By Date must be in the future';
        }

        if (numberOfOpenings < 1) return 'Number of openings must be at least 1';

        for (const q of questions) {
            if (!q.question_text.trim()) return 'All custom questions must have text';
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            const payload = {
                title: title.trim(),
                location: isRemote ? 'Remote' : locationCity.trim(),
                start_date: startImmediately ? 'Immediately' : startDate,
                duration_months: Number(durationMonths),
                stipend_min: isUnpaid ? 0 : Number(stipendMin),
                stipend_max: isUnpaid || stipendMax === '' ? 0 : Number(stipendMax),
                is_unpaid: isUnpaid,
                apply_by: applyByDate || null,
                number_of_openings: Number(numberOfOpenings),
                about_internship: aboutInternship.trim(),
                skills_required: skillsRequired,
                who_can_apply: whoCanApply,
                perks: perks,
                is_linkedin_mandatory: isLinkedinMandatory,
                questions: questions.map((q, i) => ({
                    question_text: q.question_text.trim(),
                    question_type: q.question_type,
                    is_required: q.is_required,
                    order_index: i
                })),
                target_degree: targetDegree
            };

            const response = await fetch('/api/internships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to post internship');
            }

            router.push('/internships/mine');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getMinDeadline = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    };

    if (isCheckingAccess) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-indigo-500"></div>
            </div>
        );
    }

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
        <div className="max-w-3xl mx-auto opacity-0 animate-fade-in-up pb-12">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-2 tracking-tight">Post an Internship</h1>
                <p className="text-slate-400 text-sm sm:text-base">Find top students to build your projects</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Basic Info Container */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Basic Details</h2>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                                Internship Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. Frontend Developer Intern"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Location <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={isRemote}
                                            onChange={() => setIsRemote(true)}
                                            className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                        />
                                        <span className="text-sm text-slate-300">Remote</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isRemote}
                                            onChange={() => setIsRemote(false)}
                                            className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                        />
                                        <span className="text-sm text-slate-300">In-office / Hybrid</span>
                                    </label>
                                </div>
                                {!isRemote && (
                                    <input
                                        type="text"
                                        value={locationCity}
                                        onChange={(e) => setLocationCity(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        placeholder="e.g. Bangalore"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Start Date <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={startImmediately}
                                            onChange={() => setStartImmediately(true)}
                                            className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                        />
                                        <span className="text-sm text-slate-300">Immediately</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!startImmediately}
                                            onChange={() => setStartImmediately(false)}
                                            className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                        />
                                        <span className="text-sm text-slate-300">Specific Date</span>
                                    </label>
                                </div>
                                {!startImmediately && (
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-2">
                                    Duration <span className="text-red-400">*</span>
                                </label>
                                <select
                                    id="duration"
                                    value={durationMonths}
                                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Select duration</option>
                                    {DURATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Stipend <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isUnpaid}
                                            onChange={() => setIsUnpaid(false)}
                                            className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                        />
                                        <span className="text-sm text-slate-300">Paid</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={isUnpaid}
                                            onChange={() => setIsUnpaid(true)}
                                            className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                        />
                                        <span className="text-sm text-slate-300">Unpaid</span>
                                    </label>
                                </div>
                                {!isUnpaid && (
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={stipendMin}
                                                onChange={(e) => setStipendMin(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                placeholder="Min/mo"
                                            />
                                        </div>
                                        <span className="text-slate-500">-</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={stipendMax}
                                                onChange={(e) => setStipendMax(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                placeholder="Max (opt)"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="openings" className="block text-sm font-medium text-slate-300 mb-2">
                                    Number of Openings <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="openings"
                                    type="number"
                                    min="1"
                                    value={numberOfOpenings}
                                    onChange={(e) => setNumberOfOpenings(Number(e.target.value) || 1)}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="apply_by" className="block text-sm font-medium text-slate-300 mb-2">
                                    Apply By <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="apply_by"
                                    type="date"
                                    value={applyByDate}
                                    onChange={(e) => setApplyByDate(e.target.value)}
                                    min={getMinDeadline()}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description Container */}
                    <div className="space-y-6 pt-2">
                        <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Details & Requirements</h2>

                        <div>
                            <label htmlFor="about" className="block text-sm font-medium text-slate-300 mb-2">
                                About the Internship <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                id="about"
                                value={aboutInternship}
                                onChange={(e) => setAboutInternship(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Describe the day-to-day responsibilities, what they will learn, and expectations."
                            />
                        </div>

                        <div>
                            <label htmlFor="who_can_apply" className="block text-sm font-medium text-slate-300 mb-2">
                                Who can apply <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                id="who_can_apply"
                                value={whoCanApply}
                                onChange={(e) => setWhoCanApply(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. Only those candidates can apply who are available for full time (in-office) internship for 6 months."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Who can apply (by degree) <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                                    <input type="radio" name="targetDegree" value="both" checked={targetDegree === 'both'} onChange={() => setTargetDegree('both')} className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 bg-slate-900/50" />
                                    Both UG and PG
                                </label>
                                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                                    <input type="radio" name="targetDegree" value="ug" checked={targetDegree === 'ug'} onChange={() => setTargetDegree('ug')} className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 bg-slate-900/50" />
                                    UG only
                                </label>
                                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                                    <input type="radio" name="targetDegree" value="pg" checked={targetDegree === 'pg'} onChange={() => setTargetDegree('pg')} className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 bg-slate-900/50" />
                                    PG only
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Skills Required
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {skillsRequired.map((skill, index) => (
                                    <div key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)} className="text-slate-500 hover:text-slate-300">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleSkillKeyDown}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Type a skill and press Enter (e.g. Next.js, Figma)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Perks</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PREDEFINED_PERKS.map(perk => (
                                    <button
                                        key={perk}
                                        type="button"
                                        onClick={() => handlePerkToggle(perk)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${perks.includes(perk)
                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {perk}
                                    </button>
                                ))}
                                {perks.filter(p => !PREDEFINED_PERKS.includes(p)).map(perk => (
                                    <div key={perk} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-sm font-medium">
                                        {perk}
                                        <button type="button" onClick={() => removePerk(perk)} className="text-indigo-400 hover:text-indigo-200">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={customPerkInput}
                                onChange={(e) => setCustomPerkInput(e.target.value)}
                                onKeyDown={handleCustomPerkKeyDown}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Add custom perk and press Enter"
                            />
                        </div>
                    </div>

                    {/* Applicant Requirements */}
                    <div className="space-y-6 pt-2">
                        <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Application Requirements</h2>

                        <div className="flex items-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                            <div className="flex-1">
                                <h3 className="text-slate-200 font-medium text-sm">Mandatory LinkedIn Profile</h3>
                                <p className="text-slate-400 text-xs mt-1">Require applicants to provide a link to their LinkedIn profile.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input type="checkbox" checked={isLinkedinMandatory} onChange={(e) => setIsLinkedinMandatory(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-slate-200 font-medium text-sm">Custom Assessment Questions</h3>
                                    <p className="text-slate-400 text-xs mt-1">Ask up to 5 specific questions to evaluate candidates.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    disabled={questions.length >= 5}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Question
                                </button>
                            </div>

                            {questions.length > 0 && (
                                <div className="space-y-4">
                                    {questions.map((q, index) => (
                                        <div key={q.id} className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex items-start gap-3 group">
                                            <div className="cursor-grab text-slate-500 mt-2">
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <input
                                                    type="text"
                                                    value={q.question_text}
                                                    onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                                                    placeholder={`Question ${index + 1}`}
                                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                />
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <select
                                                        value={q.question_type}
                                                        onChange={(e) => updateQuestion(q.id, 'question_type', e.target.value)}
                                                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
                                                    >
                                                        <option value="short_text">Short Text</option>
                                                        <option value="long_text">Long Text</option>
                                                        <option value="yes_no">Yes / No</option>
                                                        <option value="file_upload">File Upload</option>
                                                    </select>

                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={q.is_required}
                                                                onChange={(e) => updateQuestion(q.id, 'is_required', e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
                                                            />
                                                            <span className="text-sm text-slate-300">Required</span>
                                                        </label>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeQuestion(q.id)}
                                                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-700 transition-colors"
                                                            title="Remove question"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 min-h-[44px] border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 min-h-[44px] bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? 'Submitting...' : 'Post Internship'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
