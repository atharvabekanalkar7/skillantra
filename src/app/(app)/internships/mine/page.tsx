'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { MapPin, Users, IndianRupee, Clock, CalendarDays } from 'lucide-react';

interface Internship {
    id: string;
    title: string;
    company_name: string;
    status: 'pending_approval' | 'approved' | 'rejected' | 'closed' | 'expired';
    stipend_min: number;
    stipend_max: number;
    is_unpaid: boolean;
    duration_months: number;
    location: string;
    apply_by: string | null;
    number_of_openings: number;
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
        const newStatus = internship.status === 'closed' ? 'approved' : 'closed';
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
            showToast(`Listing ${newStatus === 'approved' ? 're-opened' : 'closed'} successfully`);
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
                <AppCard className="text-center p-12">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200 mb-2">No internships posted yet</h3>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first internship listing to start receiving applications from talented students.</p>
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
                            className="opacity-0 animate-fade-in-up-delayed p-6"
                            style={{ animationDelay: `${index * 0.08}s` }}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="text-lg md:text-xl font-semibold text-slate-100 truncate">{internship.title}</h3>
                                        <StatusBadge status={internship.status} />
                                    </div>
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                                        <div className="flex items-center gap-1.5 border border-slate-700/50 bg-slate-800/30 px-2.5 py-1 rounded-md">
                                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                            <span>{internship.location}</span>
                                        </div>
                                        <span className="hidden sm:inline text-slate-600">•</span>
                                        <span className="font-medium text-slate-300">{internship.company_name}</span>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap hidden sm:block">
                                    <div className="text-xs text-slate-500 mb-1">Posted</div>
                                    <div className="text-sm text-slate-300 font-medium">{formatTimeAgo(internship.created_at)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-4 border-y border-slate-800/60 bg-slate-900/30 -mx-6 px-6">
                                <div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                                        <IndianRupee className="w-3.5 h-3.5" /> Stipend
                                    </div>
                                    <p className="text-emerald-400 font-medium">
                                        {internship.is_unpaid ? 'Unpaid' : `₹${internship.stipend_min.toLocaleString()}${internship.stipend_max ? ` - ₹${internship.stipend_max.toLocaleString()}` : ''}/mo`}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                                        <Clock className="w-3.5 h-3.5" /> Duration
                                    </div>
                                    <p className="text-slate-200 font-medium">{internship.duration_months} Months</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                                        <CalendarDays className="w-3.5 h-3.5" /> Apply By
                                    </div>
                                    <p className="text-slate-200 font-medium">{internship.apply_by ? new Date(internship.apply_by).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                                        <Users className="w-3.5 h-3.5" /> Applicants
                                    </div>
                                    <p className="text-indigo-400 font-medium">
                                        {internship.applicant_count || 0} applications
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
                                <Link
                                    href={`/internships/${internship.id}/applicants`}
                                    className="flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    View Applications
                                    {(internship.applicant_count || 0) > 0 && (
                                        <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {internship.applicant_count}
                                        </span>
                                    )}
                                </Link>

                                {['approved', 'closed'].includes(internship.status) && (
                                    <button
                                        onClick={() => handleToggleStatus(internship)}
                                        disabled={togglingId === internship.id}
                                        className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 border ${internship.status === 'approved'
                                                ? 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
                                                : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                                            }`}
                                    >
                                        {togglingId === internship.id ? 'Updating...' : internship.status === 'approved' ? 'Close Listing' : 'Reopen Listing'}
                                    </button>
                                )}
                            </div>
                        </AppCard>
                    ))}
                </div>
            )}
        </div>
    );
}
