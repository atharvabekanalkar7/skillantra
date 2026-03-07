'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AppCard } from '@/components/ui/app-card';
import { useCountdown } from '@/lib/utils/useCountdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Internship {
    id: string;
    title: string;
    about_internship: string | null;
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
    target_degree: 'both' | 'ug' | 'pg';
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LOGO_COLORS = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-orange-500',
];

const DURATION_OPTIONS = ['All', '1m', '2m', '3m', '6m', '6m+'];
const WORK_MODE_OPTIONS = ['All', 'Remote', 'In-office'] as const;
const STIPEND_OPTIONS = ['All', 'Unpaid', 'Paid', '₹10k+'] as const;
const DEGREE_OPTIONS = ['All', 'UG', 'PG'] as const;

type WorkModeFilter = (typeof WORK_MODE_OPTIONS)[number];
type StipendFilter = (typeof STIPEND_OPTIONS)[number];
type DegreeFilter = (typeof DEGREE_OPTIONS)[number];

// Deterministic logo color from title
function logoColorForTitle(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = (hash * 31 + title.charCodeAt(i)) & 0xffff;
    }
    return LOGO_COLORS[hash % LOGO_COLORS.length];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CompanyLogo({
    logoUrl,
    companyName,
    title,
}: {
    logoUrl: string | null;
    companyName: string | null;
    title: string;
}) {
    const [imgError, setImgError] = useState(false);
    const fallbackLetter = (companyName ?? title).charAt(0).toUpperCase();
    const colorClass = logoColorForTitle(title);

    if (logoUrl && !imgError) {
        return (
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                <Image
                    src={logoUrl}
                    alt={companyName ?? 'Company logo'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div
            className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold ${colorClass}`}
        >
            {fallbackLetter}
        </div>
    );
}

function ApplyByInfo({ applyBy }: { applyBy: string | null }) {
    const countdown = useCountdown(applyBy);

    if (!applyBy || !countdown) {
        return <span className="text-slate-500 text-xs">No deadline</span>;
    }

    if (countdown.expired) {
        return <span className="text-red-400 text-xs font-medium">Applications Closed</span>;
    }

    const diffMs = new Date(applyBy).getTime() - Date.now();
    const within48h = diffMs < 48 * 60 * 60 * 1000;

    if (within48h) {
        return (
            <span className="text-amber-300 text-xs font-semibold">⏰ {countdown.text}</span>
        );
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return (
        <span className="text-slate-400 text-xs">
            {days} day{days !== 1 ? 's' : ''} left
        </span>
    );
}

function StipendText({ min, max, isUnpaid }: { min: number; max: number; isUnpaid: boolean }) {
    if (isUnpaid) {
        return <span className="text-slate-400 font-medium text-sm">Unpaid</span>;
    }

    if (min === max) {
        return (
            <span className="text-emerald-400 font-semibold text-sm">
                ₹{min.toLocaleString('en-IN')}/month
            </span>
        );
    }

    return (
        <span className="text-emerald-400 font-semibold text-sm">
            ₹{min.toLocaleString('en-IN')} - ₹{max.toLocaleString('en-IN')}/month
        </span>
    );
}

function SkillChips({ skills }: { skills: string[] }) {
    const shown = skills.slice(0, 3);
    const extra = skills.length - 3;
    return (
        <div className="flex flex-wrap gap-1.5">
            {shown.map((skill, i) => (
                <span
                    key={i}
                    className="inline-block bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-medium whitespace-nowrap"
                >
                    {skill}
                </span>
            ))}
            {extra > 0 && (
                <span className="inline-block bg-slate-800/60 text-slate-500 text-xs px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">
                    +{extra} more
                </span>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InternshipsPage() {
    const searchParams = useSearchParams();
    const isDemo = searchParams?.get('demo') === 'true';
    const [internships, setInternships] = useState<Internship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [skillFilter, setSkillFilter] = useState('');
    const [durationFilter, setDurationFilter] = useState('All');
    const [workModeFilter, setWorkModeFilter] = useState<WorkModeFilter>('All');
    const [stipendFilter, setStipendFilter] = useState<StipendFilter>('All');
    const [degreeFilter, setDegreeFilter] = useState<DegreeFilter>('All');
    const [crossCampusTooltip, setCrossCampusTooltip] = useState(false);

    useEffect(() => {
        loadInternships();
    }, [isDemo]);

    const loadInternships = async () => {
        if (isDemo) {
            setInternships([
                {
                    id: 'demo-int-1',
                    title: 'Frontend Developer Intern',
                    about_internship: 'Looking for a passionate frontend developer intern to help build beautiful user interfaces.',
                    skills_required: ['React', 'TypeScript', 'Tailwind CSS'],
                    duration_months: 3,
                    stipend_min: 15000,
                    stipend_max: 15000,
                    is_unpaid: false,
                    location: 'Remote',
                    apply_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    number_of_openings: 2,
                    status: 'approved',
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    recruiter_id: 'demo-creator-1',
                    company_name: 'TechFlow Solutions',
                    company_logo_url: null,
                },
                {
                    id: 'demo-int-2',
                    title: 'Marketing & Growth Intern',
                    about_internship: 'Join our fast-growing startup to lead digital marketing and community growth.',
                    skills_required: ['Social Media', 'Content Creation', 'SEO'],
                    duration_months: 2,
                    stipend_min: 10000,
                    stipend_max: 12000,
                    is_unpaid: false,
                    location: 'Mumbai, India',
                    apply_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    number_of_openings: 1,
                    status: 'approved',
                    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    recruiter_id: 'demo-creator-2',
                    company_name: 'GrowthHackers INC',
                    company_logo_url: null,
                },
                {
                    id: 'demo-int-3',
                    title: 'Open Source Contributor',
                    about_internship: 'Help maintain and improve our open-source tools.',
                    skills_required: ['Python', 'Git', 'Open Source'],
                    duration_months: 6,
                    stipend_min: 0,
                    stipend_max: 0,
                    is_unpaid: true,
                    location: 'Remote',
                    apply_by: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    number_of_openings: 5,
                    status: 'approved',
                    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    recruiter_id: 'demo-creator-3',
                    company_name: 'OpenComm',
                    company_logo_url: null,
                }
            ] as Internship[]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error: sbError } = await supabase
                .from('internships')
                .select(
                    'id, title, about_internship, skills_required, duration_months, stipend_min, stipend_max, is_unpaid, location, apply_by, number_of_openings, status, created_at, recruiter_id, company_name, company_logo_url, target_degree'
                )
                .eq('status', 'approved') // changed from 'open' since new flow uses approved
                .order('created_at', { ascending: false });

            if (sbError) {
                setError(sbError.message);
                return;
            }

            setInternships((data ?? []) as Internship[]);
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Error loading internships:', err);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filtered = useMemo(() => {
        return internships.filter((item) => {
            // Skill filter
            if (skillFilter.trim()) {
                const q = skillFilter.trim().toLowerCase();
                const skillsStr = (item.skills_required ?? []).join(' ').toLowerCase();
                const titleStr = (item.title ?? '').toLowerCase();
                if (!skillsStr.includes(q) && !titleStr.includes(q)) return false;
            }

            // Duration filter
            if (durationFilter !== 'All') {
                const months = parseInt(durationFilter); // "1m" -> 1
                if (durationFilter === '6m+' && item.duration_months < 6) return false;
                if (durationFilter !== '6m+' && item.duration_months !== months) return false;
            }

            // Work mode filter
            if (workModeFilter !== 'All') {
                const isRemote = item.location?.toLowerCase().includes('remote');
                if (workModeFilter === 'Remote' && !isRemote) return false;
                if (workModeFilter === 'In-office' && isRemote) return false;
            }

            // Stipend filter
            if (stipendFilter !== 'All') {
                if (stipendFilter === 'Unpaid' && !item.is_unpaid) return false;
                if (stipendFilter === 'Paid' && item.is_unpaid) return false;
                if (stipendFilter === '₹10k+' && (item.is_unpaid || item.stipend_max < 10000)) return false;
            }

            // Degree filter
            if (degreeFilter !== 'All') {
                if (degreeFilter === 'UG' && item.target_degree === 'pg') return false;
                if (degreeFilter === 'PG' && item.target_degree === 'ug') return false;
            }

            return true;
        });
    }, [internships, skillFilter, durationFilter, workModeFilter, stipendFilter, degreeFilter]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="opacity-0 animate-fade-in-up max-w-6xl mx-auto py-6 md:py-8 px-4 sm:px-6">
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-1 sm:mb-2 tracking-tight">
                    Internships
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">
                    Verified opportunities from startups and companies
                </p>
            </div>

            {/* Filter Bar */}
            <AppCard className="mb-6 p-4 sm:p-5">
                {/* Cross-campus coming soon toggle */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
                    <div
                        className="relative inline-block"
                        onMouseEnter={() => setCrossCampusTooltip(true)}
                        onMouseLeave={() => setCrossCampusTooltip(false)}
                    >
                        <button
                            disabled
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-500 text-xs font-medium cursor-not-allowed select-none opacity-60"
                            aria-disabled="true"
                        >
                            <span>🔒</span>
                            <span>Cross-campus</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400 text-[10px] font-semibold ml-1">
                                Coming soon
                            </span>
                        </button>
                        {crossCampusTooltip && (
                            <div className="absolute left-0 top-full mt-2 z-20 w-56 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl text-xs text-slate-300 leading-relaxed pointer-events-none">
                                Discover internships from students across other campuses — launching soon!
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Row 1: Skill search + Duration */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Skill text filter */}
                        <div className="flex-1 relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by skill or title (e.g. React, UX Design)"
                                value={skillFilter}
                                onChange={(e) => setSkillFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                            />
                        </div>

                        {/* Duration dropdown */}
                        <select
                            value={durationFilter}
                            onChange={(e) => setDurationFilter(e.target.value)}
                            className="sm:w-40 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] appearance-none cursor-pointer"
                        >
                            {DURATION_OPTIONS.map((d) => (
                                <option key={d} value={d}>
                                    {d === 'All' ? 'All Durations' : d === '6m+' ? 'More than 6 months' : `${d.replace('m', ' Months')}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Row 2: Work Mode pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1 w-16">
                            Location:
                        </span>
                        {WORK_MODE_OPTIONS.map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setWorkModeFilter(mode)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border ${workModeFilter === mode
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Row 3: Stipend pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1 w-16">
                            Stipend:
                        </span>
                        {STIPEND_OPTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setStipendFilter(s)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border ${stipendFilter === s
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Row 4: Degree Level pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1 w-16">
                            Degree:
                        </span>
                        {DEGREE_OPTIONS.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDegreeFilter(d)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border ${degreeFilter === d
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </AppCard>

            {/* Error */}
            {error && (
                <div className="bg-rose-900/50 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Result count */}
            {!error && (
                <p className="text-xs text-slate-500 mb-4 font-medium pl-1">
                    {filtered.length} internship{filtered.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Card Grid */}
            {internships.length === 0 && !error ? (
                <AppCard className="text-center p-8 md:p-12 border-dashed border-2 bg-slate-900/30">
                    <p className="text-slate-300 mb-2 text-xl font-bold tracking-tight">No open internships right now.</p>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Companies are currently looking for candidates. Check back soon — new opportunities are added regularly.</p>
                </AppCard>
            ) : filtered.length === 0 && !error ? (
                <AppCard className="text-center p-8 md:p-12 border-dashed border-2 bg-slate-900/30">
                    <p className="text-slate-300 mb-2 text-xl font-bold tracking-tight">No internships match your filters.</p>
                    <button
                        onClick={() => {
                            setSkillFilter('');
                            setDurationFilter('All');
                            setWorkModeFilter('All');
                            setStipendFilter('All');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2 bg-indigo-500/10 px-4 py-2 rounded-lg"
                    >
                        Clear all filters
                    </button>
                </AppCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((internship, index) => {
                        const companyName = internship.company_name ?? null;
                        const logoUrl = internship.company_logo_url ?? null;
                        const skills = internship.skills_required ?? [];
                        const isRemote = internship.location?.toLowerCase().includes('remote');

                        return (
                            <AppCard
                                key={internship.id}
                                className="flex flex-col opacity-0 animate-fade-in-up-delayed hover:border-slate-600 transition-colors"
                                style={{ animationDelay: `${index * 0.07}s` }}
                            >
                                {/* Header: Logo + Title + Company */}
                                <div className="flex items-start gap-3 mb-4">
                                    <CompanyLogo
                                        logoUrl={logoUrl}
                                        companyName={companyName}
                                        title={internship.title}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-100 leading-tight truncate">
                                            {internship.title}
                                        </h3>
                                        {companyName && (
                                            <p className="text-slate-400 text-sm truncate mt-1">{companyName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Duration + Work Mode */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="text-xs text-slate-400 font-medium bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md">
                                        ⏱ {internship.duration_months} month{internship.duration_months > 1 ? 's' : ''}
                                    </span>
                                    <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-md border ${isRemote ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
                                    >
                                        {isRemote ? '🏠 Remote' : `🏢 ${internship.location}`}
                                    </span>
                                </div>

                                {/* Stipend */}
                                <div className="mb-3 flex items-center gap-1.5">
                                    <span className="text-slate-500 text-sm font-medium">Stipend:</span>
                                    <StipendText min={internship.stipend_min} max={internship.stipend_max} isUnpaid={internship.is_unpaid} />
                                </div>

                                {/* Skills */}
                                {skills.length > 0 && (
                                    <div className="mb-4">
                                        <SkillChips skills={skills} />
                                    </div>
                                )}

                                {/* Apply by */}
                                <div className="mb-5 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-700/50">
                                        <span className="text-slate-500">Apply By:</span>
                                        <ApplyByInfo applyBy={internship.apply_by} />
                                    </div>
                                    <div className="text-slate-500">
                                        <span className="font-semibold text-slate-300">{internship.number_of_openings}</span> openings
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="mt-auto pt-4 border-t border-slate-800">
                                    <Link
                                        href={isDemo ? '#' : `/internships/${internship.id}`}
                                        onClick={(e) => {
                                            if (isDemo) {
                                                e.preventDefault();
                                                alert('Demo mode: Internship details feature not available. Sign up to view internships!');
                                            }
                                        }}
                                        className="w-full flex items-center justify-center bg-slate-100 hover:bg-white text-slate-900 py-2.5 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    >
                                        View &amp; Apply
                                    </Link>
                                </div>
                            </AppCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
