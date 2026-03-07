'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AppCard } from '@/components/ui/app-card';
import { useDemoGuard } from '@/lib/utils/useDemoGuard';

interface Internship {
    id: string;
    title: string;
    company_name: string | null;
    is_linkedin_mandatory: boolean;
    status: string;
}

interface Question {
    id: string;
    question_text: string;
}

export default function ApplicationFlowPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: internshipId } = use(params);
    const router = useRouter();
    const { guardAction } = useDemoGuard();

    // Data state
    const [internship, setInternship] = useState<Internship | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);

    // Form Step State
    const [step, setStep] = useState(1);
    const totalSteps = questions.length > 0 ? 3 : 2;

    // Form Data State
    const [resumeSource, setResumeSource] = useState<'profile' | 'upload'>('profile');
    const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [coverNote, setCoverNote] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [internshipId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // 1. Get Internship
            const { data: intData, error: intErr } = await supabase
                .from('internships')
                .select('id, title, company_name, is_linkedin_mandatory, status')
                .eq('id', internshipId)
                .single();

            if (intErr || !intData) {
                setError('Internship not found');
                return;
            }
            if (intData.status !== 'approved') {
                setError('This internship is no longer accepting applications.');
                return;
            }
            setInternship(intData);

            // 2. Get questions
            const { data: qData } = await supabase
                .from('internship_questions')
                .select('id, question_text')
                .eq('internship_id', internshipId)
                .order('created_at', { ascending: true });

            setQuestions(qData || []);

            // 3. Get profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            const { data: profData } = await supabase
                .from('profiles')
                .select('id, resume_url, linkedin_url')
                .eq('user_id', user.id)
                .single();

            if (!profData) {
                setError('Profile not found');
                return;
            }

            setProfile(profData);
            if (profData.linkedin_url) setLinkedinUrl(profData.linkedin_url);

            // 4. Rate Limiting Check
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

            const { count } = await supabase
                .from('internship_applications')
                .select('id', { count: 'exact', head: true })
                .eq('student_id', profData.id)
                .gte('created_at', twoDaysAgo);

            if ((count || 0) >= 3) {
                setError('You have reached the limit of 3 applications per 48 hours. Please try again later.');
            } else {
                // Check if already applied
                const { data: appData } = await supabase
                    .from('internship_applications')
                    .select('id')
                    .eq('internship_id', internshipId)
                    .eq('student_id', profData.id)
                    .single();

                if (appData) {
                    setError('You have already applied for this internship.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        // Validation for step 1
        if (step === 1) {
            if (internship?.is_linkedin_mandatory && !linkedinUrl.trim()) {
                alert('LinkedIn URL is mandatory for this application.');
                return;
            }
            if (!coverNote.trim() || coverNote.split(/\s+/).length > 250) {
                alert('Please provide a cover note (max 250 words).');
                return;
            }
            if (resumeSource === 'profile' && !profile?.resume_url) {
                alert('No resume found on your profile. Please upload one or build one first.');
                return;
            }
            if (resumeSource === 'upload' && !customResumeFile) {
                alert('Please upload a resume file.');
                return;
            }
        }

        // Validation for step 2 (if questions exist)
        if (step === 2 && questions.length > 0) {
            for (const q of questions) {
                if (!answers[q.id] || !answers[q.id].trim()) {
                    alert('Please answer all custom questions.');
                    return;
                }
            }
        }

        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleSubmit = guardAction(async () => {
        if (!internship) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('internshipId', internship.id);
            formData.append('coverNote', coverNote);
            if (linkedinUrl) formData.append('linkedinUrl', linkedinUrl);
            formData.append('resumeSource', resumeSource);

            if (resumeSource === 'upload' && customResumeFile) {
                formData.append('resume', customResumeFile);
            } else if (profile?.resume_url) {
                formData.append('existingResumeUrl', profile.resume_url);
            }

            // Add answers mapping
            formData.append('answers', JSON.stringify(answers));

            const res = await fetch('/api/internship-applications', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit application');
            }

            // Success string
            router.push(`/applications?success=true`);

        } catch (err: any) {
            setError(err.message || 'Failed to submit application');
            setIsSubmitting(false);
        }
    });

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="max-w-xl mx-auto py-20 px-4 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
                <h1 className="text-2xl font-bold text-slate-100 mb-4">{error}</h1>
                <Link href={`/internships/${internshipId}`} className="text-indigo-400 font-medium hover:text-indigo-300">
                    ← Back to Internship
                </Link>
            </div>
        );
    }

    if (!internship) return null;

    const renderStepProgress = () => {
        return (
            <div className="flex items-center justify-center mb-8">
                {[...Array(totalSteps)].map((_, i) => (
                    <div key={i} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${step > i + 1 ? 'bg-indigo-500 text-white' : step === i + 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-800 text-slate-500'}`}>
                            {step > i + 1 ? '✓' : i + 1}
                        </div>
                        {i < totalSteps - 1 && (
                            <div className={`w-12 sm:w-20 h-1 mx-2 rounded ${step > i + 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 opacity-0 animate-fade-in-up">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <Link href={`/internships/${internshipId}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold mb-3 inline-block">← Back</Link>
                    <h1 className="text-2xl font-bold text-slate-100">Apply for Internship</h1>
                    <p className="text-slate-400">{internship.title} at {internship.company_name}</p>
                </div>
            </div>

            {renderStepProgress()}

            <AppCard className="p-6 sm:p-8">
                {/* ─── STEP 1: Basic Info & Resume ─── */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">1. Your Profile & Resume</h2>

                        {/* Resume Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-300">Choose Resume</label>

                            <label className={`block flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${resumeSource === 'profile' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                <input type="radio" checked={resumeSource === 'profile'} onChange={() => setResumeSource('profile')} className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-600 focus:ring-indigo-500" />
                                <div>
                                    <p className="font-semibold text-slate-200">Use Profile Resume</p>
                                    {profile?.resume_url ? (
                                        <p className="text-xs text-emerald-400 mt-1">✓ Resume found on profile</p>
                                    ) : (
                                        <p className="text-xs text-rose-400 mt-1">✗ No resume uploaded. You must upload one below or build it first.</p>
                                    )}
                                </div>
                            </label>

                            <label className={`block flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${resumeSource === 'upload' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                <input type="radio" checked={resumeSource === 'upload'} onChange={() => setResumeSource('upload')} className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-600 mt-1 focus:ring-indigo-500" />
                                <div className="flex-1 w-full">
                                    <p className="font-semibold text-slate-200 mb-2">Upload New Resume (PDF)</p>
                                    {resumeSource === 'upload' && (
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setCustomResumeFile(e.target.files?.[0] || null)}
                                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                                        />
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* LinkedIn */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                LinkedIn Profile URL {internship.is_linkedin_mandatory && <span className="text-rose-400">*</span>}
                            </label>
                            <input
                                type="url"
                                value={linkedinUrl}
                                onChange={e => setLinkedinUrl(e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {internship.is_linkedin_mandatory && <p className="text-xs text-slate-500 mt-1">The recruiter has made this a mandatory requirement.</p>}
                        </div>

                        {/* Cover Note */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Cover Note <span className="text-rose-400">*</span>
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Why should you be hired for this role? What makes you a good fit?</p>
                            <textarea
                                rows={5}
                                value={coverNote}
                                onChange={e => setCoverNote(e.target.value)}
                                placeholder="Write your pitch here..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                            <div className="text-right mt-1">
                                <span className={`text-xs ${coverNote.split(/\s+/).filter(Boolean).length > 250 ? 'text-rose-400' : 'text-slate-500'}`}>
                                    {coverNote.split(/\s+/).filter(Boolean).length} / 250 words
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: Custom Questions ─── */}
                {step === 2 && questions.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">2. Custom Questions</h2>
                        <p className="text-sm text-slate-400 mb-6">The recruiter has requested you to answer the following questions.</p>

                        {questions.map((q, idx) => (
                            <div key={q.id}>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Q{idx + 1}. {q.question_text} <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    placeholder="Type your answer..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── STEP 3: Review ─── */}
                {step === totalSteps && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Review & Submit</h2>

                        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-3">
                                <span className="text-slate-500 font-medium">Resume:</span>
                                <span className="col-span-2 text-slate-200 font-semibold">{resumeSource === 'profile' ? 'Using Profile Resume' : customResumeFile?.name}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-3">
                                <span className="text-slate-500 font-medium">LinkedIn:</span>
                                <span className="col-span-2 text-slate-200 break-all">{linkedinUrl || 'Not provided'}</span>
                            </div>

                            <div className="pt-2">
                                <span className="text-slate-500 font-medium block mb-2">Cover Note:</span>
                                <p className="text-slate-300 italic p-3 bg-slate-800/50 rounded-lg whitespace-pre-wrap">{coverNote}</p>
                            </div>

                            {questions.length > 0 && (
                                <div className="pt-4 border-t border-slate-800">
                                    <span className="text-slate-500 font-medium block mb-3">Custom Questions:</span>
                                    <div className="space-y-3">
                                        {questions.map((q, idx) => (
                                            <div key={q.id}>
                                                <p className="text-slate-300 font-medium mb-1">Q{idx + 1}. {q.question_text}</p>
                                                <p className="text-slate-400 p-3 bg-slate-800/50 rounded-lg whitespace-pre-wrap">{answers[q.id]}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                            <span className="text-amber-500">ℹ️</span>
                            <p className="text-slate-300 text-sm">Once submitted, you won't be able to edit this application. Check all details before submitting.</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < totalSteps ? (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin text-xl">↻</span> Submitting...
                                </>
                            ) : (
                                <>Submit Application ✓</>
                            )}
                        </button>
                    )}
                </div>
            </AppCard>
        </div>
    );
}
