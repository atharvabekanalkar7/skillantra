'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCountdown } from '@/lib/utils/useCountdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Internship {
    id: string;
    role_title: string;
    description: string | null;
    skills_required: string[];
    duration_weeks: number;
    stipend_amount: number;
    work_mode: string;
    apply_by_date: string | null;
    seats: number;
    status: string;
    created_at: string;
    created_by: string;
    company_name: string | null;
    company_logo_url: string | null;
    website_url?: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LOGO_COLORS = [
    'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500',
];

const WORK_MODE_BADGE: Record<string, string> = {
    Remote: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    remote: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    Hybrid: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    hybrid: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    'On-site': 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
    onsite: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
};

const WORK_MODE_LABEL: Record<string, string> = {
    remote: '🏠 Remote',
    Remote: '🏠 Remote',
    hybrid: '🔄 Hybrid',
    Hybrid: '🔄 Hybrid',
    onsite: '🏢 On-site',
    'On-site': '🏢 On-site',
};

function logoColor(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
    return LOGO_COLORS[h % LOGO_COLORS.length];
}

// Word-count helper
function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CompanyLogo({
    logoUrl, companyName, roleTitle, size = 'md',
}: {
    logoUrl: string | null; companyName: string | null; roleTitle: string; size?: 'sm' | 'md' | 'lg';
}) {
    const [err, setErr] = useState(false);
    const letter = (companyName ?? roleTitle).charAt(0).toUpperCase();
    const cls = logoColor(roleTitle);
    const sz = size === 'lg' ? 'w-16 h-16 text-2xl rounded-2xl' : size === 'md' ? 'w-12 h-12 text-xl rounded-xl' : 'w-9 h-9 text-base rounded-lg';

    if (logoUrl && !err) {
        return (
            <div className={`${sz} overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700`}>
                <Image src={logoUrl} alt={companyName ?? 'Logo'} width={64} height={64}
                    className="w-full h-full object-cover" onError={() => setErr(true)} />
            </div>
        );
    }
    return (
        <div className={`${sz} flex-shrink-0 flex items-center justify-center text-white font-bold ${cls}`}>
            {letter}
        </div>
    );
}

function ApplyByCountdown({ applyByDate }: { applyByDate: string | null }) {
    const countdown = useCountdown(applyByDate);
    if (!applyByDate) return <span className="text-slate-400">No deadline set</span>;
    if (!countdown) return null;

    const diffMs = new Date(applyByDate).getTime() - Date.now();
    const within48h = diffMs > 0 && diffMs < 48 * 3600 * 1000;

    if (countdown.expired) {
        return <span className="text-red-400 font-medium">Applications Closed</span>;
    }
    if (within48h) {
        return <span className="text-amber-300 font-semibold">⏰ {countdown.text}</span>;
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return <span className="text-slate-300">{days} day{days !== 1 ? 's' : ''} left</span>;
}

// ─── Apply Modal ───────────────────────────────────────────────────────────────

function ApplyModal({
    internship,
    onClose,
    onSuccess,
}: {
    internship: Internship;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [coverNote, setCoverNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const words = wordCount(coverNote);
    const MAX_WORDS = 200;

    const companyDisplay = internship.company_name ?? 'the company';

    useEffect(() => {
        textareaRef.current?.focus();
        // Trap scroll
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (words > MAX_WORDS) {
            setError(`Please keep your answer to ${MAX_WORDS} words or fewer.`);
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/internships/${internship.id}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cover_note: coverNote }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to submit application');
                return;
            }
            onSuccess();
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <CompanyLogo
                                logoUrl={internship.company_logo_url}
                                companyName={internship.company_name}
                                roleTitle={internship.role_title}
                                size="sm"
                            />
                            <div>
                                <h2 className="text-lg font-semibold text-slate-100 leading-tight">
                                    Apply to {internship.role_title}
                                </h2>
                                <p className="text-sm text-slate-400">{companyDisplay}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-rose-900/50 border border-rose-700 text-rose-200 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="cover-note" className="block text-sm font-medium text-slate-300 mb-2">
                                Why are you a good fit?
                                <span className="text-slate-500 font-normal ml-1">(max {MAX_WORDS} words)</span>
                            </label>
                            <textarea
                                id="cover-note"
                                ref={textareaRef}
                                value={coverNote}
                                onChange={(e) => setCoverNote(e.target.value)}
                                rows={6}
                                placeholder="Describe your relevant experience, projects, or why this role excites you..."
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                            />
                            {/* Word counter */}
                            <div className="flex justify-end mt-1.5">
                                <span className={`text-xs font-medium ${words > MAX_WORDS ? 'text-rose-400' : words > MAX_WORDS * 0.8 ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {words} / {MAX_WORDS} words
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 min-h-[44px] px-5 py-2.5 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || words > MAX_WORDS}
                                className="flex-1 min-h-[44px] bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] font-semibold text-sm touch-manipulation"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Submitting…
                                    </span>
                                ) : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-800 border border-emerald-500/40 text-slate-100 text-sm px-5 py-3.5 rounded-2xl shadow-xl animate-fade-in-up">
            <span className="text-emerald-400 text-lg">✓</span>
            <span>{message}</span>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InternshipDetailPage() {
    const params = useParams();
    const internshipId = params.id as string;

    const [internship, setInternship] = useState<Internship | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Auth / ownership state
    const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
    const [isRecruiterOwner, setIsRecruiterOwner] = useState(false);

    // Application state
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        loadAll();
    }, [internshipId]);

    const loadAll = async () => {
        setLoading(true);
        try {
            // 1. Fetch internship details directly from Supabase client
            const supabase = createClient();
            const { data, error } = await supabase
                .from('internships')
                .select('*')
                .eq('id', internshipId)
                .single();

            if (error || !data) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            if (data.status !== 'open') {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setInternship(data as Internship);

            // 2. Get current user profile in parallel
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setCurrentProfileId(profile.id);
                if (data.created_by === profile.id) {
                    setIsRecruiterOwner(true);
                } else {
                    // 3. Check if already applied
                    const res = await fetch(`/api/internships/${internshipId}/apply`);
                    if (res.ok) {
                        const json = await res.json();
                        setAlreadyApplied(!!json.applied);
                    }
                }
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleApplySuccess = () => {
        setShowModal(false);
        setAlreadyApplied(true);
        setToast('Application submitted successfully! 🎉');
    };

    if (loading) return <LoadingSpinner />;

    if (notFound || !internship) {
        return (
            <div className="opacity-0 animate-fade-in-up max-w-2xl mx-auto py-16 text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h1 className="text-2xl font-semibold text-slate-100 mb-3">Internship not found</h1>
                <p className="text-slate-400 mb-8">
                    This internship may have been closed or doesn't exist.
                </p>
                <Link
                    href="/internships"
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all font-medium"
                >
                    ← Browse Internships
                </Link>
            </div>
        );
    }

    const skills = internship.skills_required ?? [];
    const isDeadlinePassed = internship.apply_by_date
        ? new Date(internship.apply_by_date).getTime() <= Date.now()
        : false;
    const canApply = !isRecruiterOwner && !alreadyApplied && !isDeadlinePassed;

    return (
        <>
            {/* Toast */}
            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

            {/* Modal */}
            {showModal && (
                <ApplyModal
                    internship={internship}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleApplySuccess}
                />
            )}

            <div className="opacity-0 animate-fade-in-up max-w-6xl mx-auto py-6 md:py-8">
                {/* Back breadcrumb */}
                <div className="mb-6">
                    <Link
                        href="/internships"
                        className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-semibold group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                        Back to Internships
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {/* ── Left Column ─────────────────────────────────────────────── */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* Company header card */}
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                            <div className="flex items-start gap-4 mb-4">
                                <CompanyLogo
                                    logoUrl={internship.company_logo_url}
                                    companyName={internship.company_name}
                                    roleTitle={internship.role_title}
                                    size="lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight mb-1">
                                        {internship.role_title}
                                    </h1>
                                    {internship.company_name && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-slate-300 font-medium">{internship.company_name}</p>
                                            {internship.website_url && (
                                                <a
                                                    href={internship.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                                                >
                                                    ↗ Website
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {internship.description && (
                            <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                                <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                                    <span>🛠</span> What you'll build
                                </h2>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {internship.description}
                                </p>
                            </section>
                        )}

                        {/* Skills */}
                        {skills.length > 0 && (
                            <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                    <span>⚡</span> Skills Required
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="inline-block bg-indigo-500/10 text-indigo-300 text-sm px-4 py-1.5 rounded-xl border border-indigo-500/25 font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* About this internship */}
                        <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                            <h2 className="text-lg font-semibold text-slate-100 mb-5 flex items-center gap-2">
                                <span>📋</span> About this Internship
                            </h2>
                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                <div>
                                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Duration</dt>
                                    <dd className="text-slate-200 font-medium">{internship.duration_weeks} weeks</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Work Mode</dt>
                                    <dd>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${WORK_MODE_BADGE[internship.work_mode] ?? 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {WORK_MODE_LABEL[internship.work_mode] ?? internship.work_mode}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Monthly Stipend</dt>
                                    <dd className={internship.stipend_amount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-medium'}>
                                        {internship.stipend_amount > 0
                                            ? `₹${internship.stipend_amount.toLocaleString('en-IN')}`
                                            : 'Unpaid'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Seats Available</dt>
                                    <dd className="text-slate-200 font-medium">{internship.seats}</dd>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Apply By</dt>
                                    <dd className="text-sm">
                                        <ApplyByCountdown applyByDate={internship.apply_by_date} />
                                        {internship.apply_by_date && (
                                            <p className="text-slate-500 text-xs mt-0.5">
                                                {new Date(internship.apply_by_date).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                    </div>

                    {/* ── Right Column (sticky) ────────────────────────────────────── */}
                    <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-6">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.8)] overflow-hidden">
                            {/* Top accent */}
                            <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

                            <div className="p-6 space-y-4">
                                {/* Stipend */}
                                <div className="text-center pb-4 border-b border-slate-800">
                                    {internship.stipend_amount > 0 ? (
                                        <>
                                            <p className="text-3xl font-bold text-emerald-400">
                                                ₹{internship.stipend_amount.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-slate-400 text-sm mt-0.5">per month</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-slate-400">Unpaid</p>
                                            <p className="text-slate-500 text-sm mt-0.5">No stipend</p>
                                        </>
                                    )}
                                </div>

                                {/* Quick info */}
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Duration</span>
                                        <span className="text-slate-200 font-medium">{internship.duration_weeks} weeks</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Work mode</span>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${WORK_MODE_BADGE[internship.work_mode] ?? 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {WORK_MODE_LABEL[internship.work_mode] ?? internship.work_mode}
                                        </span>
                                    </div>
                                    {internship.apply_by_date && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">Apply by</span>
                                            <span className="text-slate-200 text-xs font-medium">
                                                {new Date(internship.apply_by_date).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="pt-2 space-y-3">
                                    {isRecruiterOwner ? (
                                        <Link
                                            href={`/internships/${internship.id}/applicants`}
                                            className="w-full min-h-[48px] flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 active:scale-[0.98] font-semibold text-sm touch-manipulation"
                                        >
                                            Manage Applicants →
                                        </Link>
                                    ) : alreadyApplied ? (
                                        <>
                                            <button
                                                disabled
                                                className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-slate-700 text-slate-300 py-3 px-4 rounded-xl font-semibold text-sm cursor-not-allowed"
                                            >
                                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Application Submitted
                                            </button>
                                            <Link
                                                href="/applications"
                                                className="w-full min-h-[40px] flex items-center justify-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                                            >
                                                Track in My Applications →
                                            </Link>
                                        </>
                                    ) : isDeadlinePassed ? (
                                        <button
                                            disabled
                                            className="w-full min-h-[48px] flex items-center justify-center bg-slate-700 text-slate-400 py-3 px-4 rounded-xl font-semibold text-sm cursor-not-allowed"
                                        >
                                            Applications Closed
                                        </button>
                                    ) : !currentProfileId ? (
                                        <Link
                                            href="/login"
                                            className="w-full min-h-[48px] flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-500 transition-all font-semibold text-sm"
                                        >
                                            Sign In to Apply
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="w-full min-h-[48px] flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.01] font-semibold text-sm touch-manipulation"
                                        >
                                            Apply Now
                                        </button>
                                    )}
                                </div>

                                {/* Trust line */}
                                {!isRecruiterOwner && (
                                    <p className="text-center text-xs text-slate-500 pt-1">
                                        Your data is only shared with the recruiter
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
