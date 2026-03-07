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
    role_title: string;
    description: string | null;
    skills_required: string[];
    duration_weeks: number;
    stipend_amount: number;
    work_mode: 'Remote' | 'Hybrid' | 'On-site';
    apply_by_date: string | null;
    seats: number;
    status: string;
    created_at: string;
    created_by: string;
    company_name: string | null;
    company_logo_url: string | null;
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

const WORK_MODE_BADGE: Record<string, string> = {
    Remote: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    Hybrid: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    'On-site': 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
};

const DURATION_OPTIONS = ['All', '2w', '4w', '6w', '8w', '12w'];
const WORK_MODE_OPTIONS = ['All', 'Remote', 'Hybrid', 'On-site'] as const;
const STIPEND_OPTIONS = ['All', 'Unpaid', '₹1–5k', '₹5–15k', '₹15k+'] as const;

type WorkModeFilter = (typeof WORK_MODE_OPTIONS)[number];
type StipendFilter = (typeof STIPEND_OPTIONS)[number];

// Deterministic logo color from role title
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
    roleTitle,
}: {
    logoUrl: string | null;
    companyName: string | null;
    roleTitle: string;
}) {
    const [imgError, setImgError] = useState(false);
    const fallbackLetter = (companyName ?? roleTitle).charAt(0).toUpperCase();
    const colorClass = logoColorForTitle(roleTitle);

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

function ApplyByInfo({ applyByDate }: { applyByDate: string | null }) {
    const countdown = useCountdown(applyByDate);

    if (!applyByDate || !countdown) {
        return <span className="text-slate-500 text-xs">No deadline</span>;
    }

    if (countdown.expired) {
        return <span className="text-red-400 text-xs font-medium">Applications Closed</span>;
    }

    const diffMs = new Date(applyByDate).getTime() - Date.now();
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

function StipendText({ amount }: { amount: number }) {
    if (amount === 0) {
        return <span className="text-slate-400 font-medium text-sm">Unpaid</span>;
    }
    return (
        <span className="text-emerald-400 font-semibold text-sm">
            ₹{amount.toLocaleString('en-IN')}/month
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
                    className="inline-block bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-medium"
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
    const [crossCampus, setCrossCampus] = useState(false);
    const [crossCampusTooltip, setCrossCampusTooltip] = useState(false);

    useEffect(() => {
        loadInternships();
    }, [isDemo]);

    const loadInternships = async () => {
        if (isDemo) {
            setInternships([
                {
                    id: 'demo-int-1',
                    role_title: 'Frontend Developer Intern',
                    description: 'Looking for a passionate frontend developer intern to help build beautiful user interfaces.',
                    skills_required: ['React', 'TypeScript', 'Tailwind CSS'],
                    duration_weeks: 12,
                    stipend_amount: 15000,
                    work_mode: 'Remote',
                    apply_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    seats: 2,
                    status: 'open',
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'demo-creator-1',
                    company_name: 'TechFlow Solutions',
                    company_logo_url: null,
                },
                {
                    id: 'demo-int-2',
                    role_title: 'Marketing & Growth Intern',
                    description: 'Join our fast-growing startup to lead digital marketing and community growth.',
                    skills_required: ['Social Media', 'Content Creation', 'SEO'],
                    duration_weeks: 8,
                    stipend_amount: 10000,
                    work_mode: 'Hybrid',
                    apply_by_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    seats: 1,
                    status: 'open',
                    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'demo-creator-2',
                    company_name: 'GrowthHackers INC',
                    company_logo_url: null,
                },
                {
                    id: 'demo-int-3',
                    role_title: 'UI/UX Design Intern',
                    description: 'Help us redesign our core platform and create amazing experiences for our users.',
                    skills_required: ['Figma', 'Prototyping', 'User Research'],
                    duration_weeks: 4,
                    stipend_amount: 8000,
                    work_mode: 'On-site',
                    apply_by_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    seats: 1,
                    status: 'open',
                    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 'demo-creator-3',
                    company_name: 'DesignStudio',
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
                    'id, role_title, description, skills_required, duration_weeks, stipend_amount, work_mode, apply_by_date, seats, status, created_at, created_by, company_name, company_logo_url'
                )
                .eq('status', 'open')
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
                if (!skillsStr.includes(q)) return false;
            }

            // Duration filter
            if (durationFilter !== 'All') {
                const weeks = parseInt(durationFilter); // e.g. "2w" → 2
                if (item.duration_weeks !== weeks) return false;
            }

            // Work mode filter
            if (workModeFilter !== 'All') {
                if (item.work_mode !== workModeFilter) return false;
            }

            // Stipend filter
            if (stipendFilter !== 'All') {
                const amt = item.stipend_amount;
                if (stipendFilter === 'Unpaid' && amt !== 0) return false;
                if (stipendFilter === '₹1–5k' && (amt < 1 || amt > 5000)) return false;
                if (stipendFilter === '₹5–15k' && (amt <= 5000 || amt > 15000)) return false;
                if (stipendFilter === '₹15k+' && amt <= 15000) return false;
            }

            return true;
        });
    }, [internships, skillFilter, durationFilter, workModeFilter, stipendFilter]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="opacity-0 animate-fade-in-up max-w-6xl mx-auto py-6 md:py-8">
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-1 sm:mb-2">
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
                                placeholder="Search by skill (e.g. React, Figma)"
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
                                    {d === 'All' ? 'All Durations' : d}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Row 2: Work Mode pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">
                            Mode:
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
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">
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
                </div>
            </AppCard>

            {/* Error */}
            {error && (
                <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Result count */}
            {!error && (
                <p className="text-xs text-slate-500 mb-4">
                    {filtered.length} internship{filtered.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Card Grid */}
            {internships.length === 0 && !error ? (
                <AppCard className="text-center p-8 md:p-10">
                    <p className="text-slate-400 mb-2 text-lg font-medium">No open internships right now.</p>
                    <p className="text-slate-500 text-sm">Check back soon — new opportunities are added regularly.</p>
                </AppCard>
            ) : filtered.length === 0 && !error ? (
                <AppCard className="text-center p-8 md:p-10">
                    <p className="text-slate-400 mb-2 text-lg font-medium">No internships match your filters.</p>
                    <button
                        onClick={() => {
                            setSkillFilter('');
                            setDurationFilter('All');
                            setWorkModeFilter('All');
                            setStipendFilter('All');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                        Clear all filters →
                    </button>
                </AppCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((internship, index) => {
                        const companyName = internship.company_name ?? null;
                        const logoUrl = internship.company_logo_url ?? null;
                        const skills = internship.skills_required ?? [];

                        return (
                            <AppCard
                                key={internship.id}
                                className="flex flex-col opacity-0 animate-fade-in-up-delayed"
                                style={{ animationDelay: `${index * 0.07}s` }}
                            >
                                {/* Header: Logo + Title + Company */}
                                <div className="flex items-start gap-3 mb-4">
                                    <CompanyLogo
                                        logoUrl={logoUrl}
                                        companyName={companyName}
                                        roleTitle={internship.role_title}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-slate-100 leading-snug truncate">
                                            {internship.role_title}
                                        </h3>
                                        {companyName && (
                                            <p className="text-slate-400 text-sm truncate mt-0.5">{companyName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Duration + Work Mode */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="text-xs text-slate-400 font-medium bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                                        ⏱ {internship.duration_weeks}w
                                    </span>
                                    <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-lg ${WORK_MODE_BADGE[internship.work_mode] ?? 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                                    >
                                        {internship.work_mode === 'Remote'
                                            ? '🏠 Remote'
                                            : internship.work_mode === 'Hybrid'
                                                ? '🔄 Hybrid'
                                                : '🏢 On-site'}
                                    </span>
                                </div>

                                {/* Stipend */}
                                <div className="mb-3">
                                    <StipendText amount={internship.stipend_amount} />
                                </div>

                                {/* Skills */}
                                {skills.length > 0 && (
                                    <div className="mb-3">
                                        <SkillChips skills={skills} />
                                    </div>
                                )}

                                {/* Apply by */}
                                <div className="mb-4 flex items-center gap-1.5">
                                    <svg
                                        className="w-3.5 h-3.5 text-slate-500 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <ApplyByInfo applyByDate={internship.apply_by_date} />
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
                                        className="w-full min-h-[44px] flex items-center justify-center bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.02] font-medium text-sm touch-manipulation"
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
