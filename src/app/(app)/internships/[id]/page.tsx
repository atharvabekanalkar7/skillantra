'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCountdown } from '@/lib/utils/useCountdown';
import { AppCard } from '@/components/ui/app-card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Internship {
    id: string;
    title: string;
    about_internship: string | null;
    who_can_apply: string | null;
    perks: string[];
    skills_required: string[];
    duration_months: number;
    stipend_min: number;
    stipend_max: number;
    is_unpaid: boolean;
    location: string;
    apply_by: string | null;
    number_of_openings: number;
    status: string;
    created_at: string;
    recruiter_id: string;
    company_name: string | null;
    company_logo_url: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LOGO_COLORS = [
    'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500',
];

function logoColor(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
    return LOGO_COLORS[h % LOGO_COLORS.length];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CompanyLogo({
    logoUrl, companyName, title, size = 'md',
}: {
    logoUrl: string | null; companyName: string | null; title: string; size?: 'sm' | 'md' | 'lg';
}) {
    const [err, setErr] = useState(false);
    const letter = (companyName ?? title).charAt(0).toUpperCase();
    const cls = logoColor(title);
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

function ApplyByCountdown({ applyBy }: { applyBy: string | null }) {
    const countdown = useCountdown(applyBy);
    if (!applyBy) return <span className="text-slate-400">No deadline set</span>;
    if (!countdown) return null;

    const diffMs = new Date(applyBy).getTime() - Date.now();
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

export default function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: internshipId } = use(params);

    const [internship, setInternship] = useState<Internship | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Auth / ownership state
    const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
    const [isRecruiterOwner, setIsRecruiterOwner] = useState(false);
    const [isRecruiter, setIsRecruiter] = useState(false);

    // Application state
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [applicantCount, setApplicantCount] = useState(0);

    // Rate limit state
    const [appCount48h, setAppCount48h] = useState(0);

    useEffect(() => {
        loadAll();
    }, [internshipId]);

    const loadAll = async () => {
        setLoading(true);
        try {
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

            if (data.status !== 'approved' && data.status !== 'closed') {
                // If it's pending approval and not the owner viewing, hide it
                // To do this properly, we'll check ownership below
            }

            setInternship(data as Internship);

            // Fetch applicant count
            const { count } = await supabase.from('internship_applications').select('*', { count: 'exact', head: true }).eq('internship_id', internshipId);
            setApplicantCount(count || 0);

            // Get current user profile in parallel
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, user_type')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setCurrentProfileId(profile.id);
                if (profile.user_type === 'recruiter') setIsRecruiter(true);

                if (data.recruiter_id === profile.id) {
                    setIsRecruiterOwner(true);
                } else if (profile.user_type === 'student') {
                    // Check if already applied
                    const { data: appData } = await supabase.from('internship_applications').select('id').eq('internship_id', internshipId).eq('student_id', profile.id).single();
                    if (appData) setAlreadyApplied(true);

                    // Check application count in last 48 hours for rate limiting UI
                    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
                    const { count: recentCount } = await supabase
                        .from('internship_applications')
                        .select('id', { count: 'exact', head: true })
                        .eq('student_id', profile.id)
                        .gte('created_at', twoDaysAgo);

                    setAppCount48h(recentCount || 0);
                }
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
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
    const perks = internship.perks ?? [];
    const isDeadlinePassed = internship.apply_by
        ? new Date(internship.apply_by).getTime() <= Date.now()
        : false;
    const isRateLimited = appCount48h >= 3;
    const isRemote = internship.location?.toLowerCase().includes('remote');

    return (
        <div className="opacity-0 animate-fade-in-up max-w-6xl mx-auto py-6 md:py-8 px-4 sm:px-6">
            {/* Back breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/internships"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-semibold group bg-indigo-500/10 px-3 py-1.5 rounded-full"
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
                                title={internship.title}
                                size="lg"
                            />
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight mb-1">
                                    {internship.title}
                                </h1>
                                {internship.company_name && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-slate-300 font-medium">{internship.company_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* About Description */}
                    {internship.about_internship && (
                        <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                            <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                                <span>📋</span> About the Internship
                            </h2>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {internship.about_internship}
                            </p>
                        </section>
                    )}

                    {/* Who can apply */}
                    {internship.who_can_apply && (
                        <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                            <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                                <span>🎯</span> Who can apply
                            </h2>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {internship.who_can_apply}
                            </p>
                        </section>
                    )}

                    {/* Skills & Perks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                        {perks.length > 0 && (
                            <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                    <span>🎁</span> Perks
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {perks.map((perk, i) => (
                                        <span
                                            key={i}
                                            className="inline-block bg-emerald-500/10 text-emerald-300 text-sm px-4 py-1.5 rounded-xl border border-emerald-500/25 font-medium"
                                        >
                                            {perk}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)] backdrop-blur-sm">
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                            <div>
                                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Duration</dt>
                                <dd className="text-slate-200 font-medium">{internship.duration_months} Month{internship.duration_months > 1 ? 's' : ''}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Location</dt>
                                <dd>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${isRemote ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {isRemote ? '🏠 Remote' : `🏢 ${internship.location}`}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Stipend</dt>
                                <dd className={internship.is_unpaid ? 'text-slate-400 font-medium' : 'text-emerald-400 font-semibold'}>
                                    {internship.is_unpaid
                                        ? 'Unpaid'
                                        : (internship.stipend_min === internship.stipend_max
                                            ? `₹${internship.stipend_min.toLocaleString('en-IN')}/mo`
                                            : `₹${internship.stipend_min.toLocaleString('en-IN')} - ${internship.stipend_max.toLocaleString('en-IN')}/mo`)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Openings</dt>
                                <dd className="text-slate-200 font-medium">{internship.number_of_openings}</dd>
                            </div>
                        </dl>
                    </section>

                </div>

                {/* ── Right Column (sticky) ────────────────────────────────────── */}
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.8)] overflow-hidden">
                        {/* Top accent */}
                        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

                        <div className="p-6 space-y-6">
                            {/* KPI Board */}
                            <div className="text-center pb-5 border-b border-slate-800 space-y-2">
                                <div className="inline-flex flex-col items-center">
                                    <span className="text-4xl font-black text-slate-100">{applicantCount}</span>
                                    <span className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Applicants</span>
                                </div>
                            </div>

                            {/* Quick info */}
                            <div className="space-y-3.5">
                                {internship.apply_by && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Apply by</span>
                                        <span className="text-slate-200 text-xs font-medium bg-slate-800 px-2 py-1 rounded">
                                            {new Date(internship.apply_by).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Time left</span>
                                    <ApplyByCountdown applyBy={internship.apply_by} />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Posted</span>
                                    <span className="text-slate-300 text-xs">
                                        {new Date(internship.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="pt-2 space-y-3">
                                {isRecruiterOwner ? (
                                    <Link
                                        href={`/internships/${internship.id}/applicants`}
                                        className="w-full min-h-[48px] flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] font-bold text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                    >
                                        Manage Applicants →
                                    </Link>
                                ) : isRecruiter ? (
                                    <div className="bg-slate-800/80 border border-slate-700 py-3 px-4 rounded-xl flex items-center justify-center">
                                        <p className="text-slate-400 text-sm font-medium text-center">Only students can apply for internships</p>
                                    </div>
                                ) : alreadyApplied ? (
                                    <>
                                        <button
                                            disabled
                                            className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-3 px-4 rounded-xl font-bold text-sm cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                ) : isDeadlinePassed || internship.status === 'closed' ? (
                                    <button
                                        disabled
                                        className="w-full min-h-[48px] flex items-center justify-center bg-slate-800 text-slate-500 py-3 px-4 rounded-xl font-bold text-sm cursor-not-allowed border border-slate-700 shadow-inner"
                                    >
                                        Applications Closed
                                    </button>
                                ) : !currentProfileId ? (
                                    <Link
                                        href="/login"
                                        className="w-full min-h-[48px] flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-500 transition-all font-bold text-sm shadow-lg shadow-indigo-900/50"
                                    >
                                        Sign In to Apply
                                    </Link>
                                ) : isRateLimited ? (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                                        <p className="text-amber-400 text-xs font-semibold mb-1">Rate Limit Reached</p>
                                        <p className="text-slate-400 text-xs leading-relaxed">You have reached your limit of 3 applications per 48 hours to ensure high quality submissions.</p>
                                    </div>
                                ) : (
                                    <Link
                                        href={`/internships/${internship.id}/apply`}
                                        className="w-full min-h-[48px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.01] font-bold text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] touch-manipulation"
                                    >
                                        Apply Now
                                    </Link>
                                )}
                            </div>

                            {/* Trust line */}
                            {!isRecruiterOwner && (
                                <p className="text-center text-xs text-slate-500 pt-1">
                                    Application limit: 3 per 48 hours. Make them count!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
