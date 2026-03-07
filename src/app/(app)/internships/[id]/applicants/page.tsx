'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatTimeAgo } from '@/lib/utils/timeAgo';

// Declare Razorpay on window for TypeScript
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface ApplicantProfile {
    id: string;
    name: string;
    college: string | null;
    skills: string | null;
}

interface Application {
    id: string;
    internship_id: string;
    applicant_profile_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'hired';
    payment_status: 'unpaid' | 'paid';
    cover_note: string | null;
    created_at: string;
    applicant?: ApplicantProfile;
}

interface Internship {
    id: string;
    role_title: string;
    company_name: string;
    stipend_amount: number;
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: internshipId } = use(params);
    const router = useRouter();

    const [internship, setInternship] = useState<Internship | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [internRes, appsRes] = await Promise.all([
                fetch(`/api/internships/${internshipId}`),
                fetch(`/api/internships/${internshipId}/applicants`),
            ]);

            const internData = await internRes.json();
            const appsData = await appsRes.json();

            if (!internRes.ok) {
                setError(internData.error || 'Failed to load internship');
                return;
            }
            if (!appsRes.ok) {
                setError(appsData.error || 'Failed to load applications');
                return;
            }

            setInternship(internData.internship);
            setApplications(appsData.applications || []);
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [internshipId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReject = async (applicationId: string) => {
        setActionId(applicationId);
        try {
            const res = await fetch(`/api/applications/${applicationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to reject', 'error');
                return;
            }
            showToast('Application rejected');
            setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'rejected' } : a));
        } catch {
            showToast('An unexpected error occurred', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleHireAndPay = async (application: Application) => {
        if (!internship) return;
        setActionId(application.id);

        try {
            // Load Razorpay script
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                showToast('Failed to load payment window. Please try again.', 'error');
                setActionId(null);
                return;
            }

            // Create Razorpay order
            const orderRes = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    internship_id: internshipId,
                    applicant_id: application.applicant_profile_id,
                }),
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                showToast(orderData.error || 'Failed to create payment order', 'error');
                setActionId(null);
                return;
            }

            const { order_id, amount, currency } = orderData;

            // Open Razorpay checkout
            const rzpOptions = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount,
                currency,
                order_id,
                name: 'SkillAntra',
                description: `Platform fee for hiring intern`,
                theme: { color: '#7c3aed' },
                modal: {
                    ondismiss: () => {
                        showToast('Payment cancelled', 'error');
                        setActionId(null);
                    },
                },
                handler: async () => {
                    // Payment captured – webhook will update DB, just show toast and refresh
                    showToast('🎉 Intern hired! Chat unlocked.');
                    await loadData();
                    setActionId(null);
                },
            };

            const rzp = new window.Razorpay(rzpOptions);
            rzp.on('payment.failed', (response: any) => {
                showToast(response?.error?.description || 'Payment failed', 'error');
                setActionId(null);
            });
            rzp.open();
        } catch {
            showToast('An unexpected error occurred', 'error');
            setActionId(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <div className="bg-rose-900/50 border border-rose-800 text-rose-200 px-5 py-4 rounded-xl">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="opacity-0 animate-fade-in-up max-w-3xl mx-auto py-6 md:py-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 text-sm px-5 py-3 rounded-xl shadow-lg border animate-fade-in-up ${toast.type === 'error'
                        ? 'bg-rose-900 border-rose-800 text-rose-200'
                        : 'bg-slate-800 border-slate-700 text-slate-100'
                    }`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6 md:mb-8">
                <button
                    onClick={() => router.push('/internships/mine')}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 text-sm transition-colors"
                >
                    ← My Internships
                </button>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-1">
                    {internship?.role_title ?? 'Applicants'}
                </h1>
                {internship && (
                    <p className="text-slate-400 text-sm">{internship.company_name} · ₹{internship.stipend_amount.toLocaleString()}/mo</p>
                )}
            </div>

            {applications.length === 0 ? (
                <AppCard className="text-center p-8">
                    <p className="text-slate-400 text-lg">No applications yet.</p>
                    <p className="text-slate-500 text-sm mt-2">Share your listing to attract candidates.</p>
                </AppCard>
            ) : (
                <div className="space-y-4">
                    {applications.map((application, index) => (
                        <AppCard
                            key={application.id}
                            className="opacity-0 animate-fade-in-up-delayed"
                            style={{ animationDelay: `${index * 0.08}s` }}
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="text-slate-100 font-semibold">
                                            {application.applicant?.name ?? 'Unknown Applicant'}
                                        </h3>
                                        {application.applicant?.id && (
                                            <Link
                                                href={`/profile/${application.applicant.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                            >
                                                👤 View Profile ↗
                                            </Link>
                                        )}
                                    </div>
                                    {application.applicant?.college && (
                                        <p className="text-xs text-slate-400">{application.applicant.college}</p>
                                    )}
                                </div>
                                <StatusBadge status={application.status} />
                            </div>

                            {/* Skills chips */}
                            {application.applicant?.skills && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {application.applicant.skills.split(',').map((skill, i) => (
                                        <span
                                            key={i}
                                            className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg border border-slate-700 font-medium"
                                        >
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Cover note */}
                            {application.cover_note && (
                                <p className="text-slate-400 text-sm mb-3 leading-relaxed italic">
                                    "{application.cover_note}"
                                </p>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3 pt-3 border-t border-slate-800">
                                <p className="text-xs text-slate-500">Applied {formatTimeAgo(application.created_at)}</p>

                                <div className="flex flex-wrap gap-2">
                                    {application.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleHireAndPay(application)}
                                                disabled={actionId === application.id}
                                                className="min-h-[36px] bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionId === application.id ? 'Opening...' : '💳 Hire & Pay'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(application.id)}
                                                disabled={actionId === application.id}
                                                className="min-h-[36px] bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 py-1.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {(application.status === 'accepted' || application.status === 'hired') && (
                                        <Link
                                            href="/messages"
                                            className="min-h-[36px] inline-flex items-center bg-emerald-700 hover:bg-emerald-600 text-white py-1.5 px-4 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            💬 Open Chat
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </AppCard>
                    ))}
                </div>
            )}
        </div>
    );
}
