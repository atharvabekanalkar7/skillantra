'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatTimeAgo } from '@/lib/utils/timeAgo';

const WORK_MODE_LABELS: Record<string, string> = {
    remote: '🏠 Remote',
    hybrid: '🔄 Hybrid',
    onsite: '🏢 On-site',
};

interface Internship {
    id: string;
    role_title: string;
    company_name: string;
    status: 'open' | 'closed' | 'filled';
    stipend_amount: number;
    duration_weeks: number;
    work_mode: string;
    apply_by_date: string | null;
    seats: number;
    created_at: string;
    applicant_count?: number;
}

export default function MyInternshipsPage() {
    const router = useRouter();
    const [internships, setInternships] = useState<Internship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        loadInternships();
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const loadInternships = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/internships?mine=true');
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to load internships');
                return;
            }
            setInternships(data.internships || []);
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (internship: Internship) => {
        const newStatus = internship.status === 'open' ? 'closed' : 'open';
        setTogglingId(internship.id);
        try {
            const res = await fetch(`/api/internships/${internship.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to update status');
                return;
            }
            showToast(`Listing ${newStatus === 'open' ? 're-opened' : 'closed'} successfully`);
            setInternships(prev => prev.map(i => i.id === internship.id ? { ...i, status: newStatus } : i));
        } catch {
            showToast('An unexpected error occurred');
        } finally {
            setTogglingId(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
            {/* Toast */}
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-slate-800 border border-slate-700 text-slate-100 text-sm px-5 py-3 rounded-xl shadow-lg animate-fade-in-up">
                    {toast}
                </div>
            )}

            <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-2">My Internships</h1>
                    <p className="text-slate-400 text-sm sm:text-base">Manage your posted internship listings</p>
                </div>
                <Link
                    href="/internships/new"
                    className="w-full sm:w-auto min-h-[44px] flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.02] font-medium touch-manipulation"
                >
                    Post New Internship
                </Link>
            </div>

            {error && (
                <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {internships.length === 0 ? (
                <AppCard className="text-center p-8">
                    <p className="text-slate-400 mb-4 text-lg">No internships posted yet.</p>
                    <Link
                        href="/internships/new"
                        className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group"
                    >
                        Post Your First Internship <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
                    </Link>
                </AppCard>
            ) : (
                <div className="space-y-4">
                    {internships.map((internship, index) => (
                        <AppCard
                            key={internship.id}
                            className="opacity-0 animate-fade-in-up-delayed"
                            style={{ animationDelay: `${index * 0.08}s` }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="text-lg font-semibold text-slate-100">{internship.role_title}</h3>
                                        <StatusBadge status={internship.status} />
                                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                            {WORK_MODE_LABELS[internship.work_mode] ?? internship.work_mode}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400">{internship.company_name}</p>
                                    {internship.applicant_count !== undefined && internship.applicant_count > 0 && (
                                        <p className="text-sm text-indigo-400 font-medium mt-1">
                                            {internship.applicant_count} applicant{internship.applicant_count !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Monthly Stipend</p>
                                    <p className="text-emerald-400 font-medium text-sm">₹{internship.stipend_amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Duration</p>
                                    <p className="text-slate-300 text-sm">{internship.duration_weeks} weeks</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Seats</p>
                                    <p className="text-slate-300 text-sm">{internship.seats}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                                <div className="text-xs text-slate-500">
                                    Posted {formatTimeAgo(internship.created_at)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link
                                        href={`/internships/${internship.id}/applicants`}
                                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 group inline-flex items-center gap-1"
                                    >
                                        View Applications <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                                    </Link>
                                    <Link
                                        href={`/internships/${internship.id}/edit`}
                                        className="text-amber-500 hover:text-amber-400 text-sm font-medium"
                                    >
                                        ✏️ Edit
                                    </Link>
                                    <button
                                        onClick={() => handleToggleStatus(internship)}
                                        disabled={togglingId === internship.id || internship.status === 'filled'}
                                        className={`text-sm font-medium px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${internship.status === 'open'
                                                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700'
                                                : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/30 border border-emerald-800'
                                            }`}
                                    >
                                        {togglingId === internship.id ? 'Updating...' : internship.status === 'open' ? 'Close Listing' : 'Reopen Listing'}
                                    </button>
                                </div>
                            </div>
                        </AppCard>
                    ))}
                </div>
            )}
        </div>
    );
}
