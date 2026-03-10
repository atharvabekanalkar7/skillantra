'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { FileText, CheckCircle, XCircle, MessageSquare, Linkedin, Eye, Download, Users } from 'lucide-react';
import { useDemoGuard } from '@/lib/utils/useDemoGuard';
import html2canvas from 'html2canvas';

declare global {
    interface Window {
        html2pdf: any;
    }
}

function loadHtml2Pdf(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.html2pdf) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

const generateResumeHTML = (
    basicInfo: any,
    education: any[],
    experience: any[],
    projects: any[],
    achievements: any[]
) => {
    const hasData = (field: any) => field && field.length > 0;
    const hasBasic = (val: string) => val && val.trim().length > 0;

    return `
        <div style="font-family: 'EB Garamond', serif; padding: 40px; color: #222; line-height: 1.6; background: #fff; width: 100%; box-sizing: border-box;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="margin: 0 0 5px 0; font-size: 28px; font-weight: bold; text-transform: uppercase; color: #000;">
                    ${basicInfo.name || 'Your Name'}
                </h1>
                <div style="font-size: 14px; color: #444; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                    ${hasBasic(basicInfo.city) ? `<span>${basicInfo.city}</span>` : ''}
                    ${hasBasic(basicInfo.phone) ? `<span>${hasBasic(basicInfo.city) ? ' | ' : ''}${basicInfo.phone}</span>` : ''}
                    ${hasBasic(basicInfo.email) ? `<span>${(hasBasic(basicInfo.city) || hasBasic(basicInfo.phone)) ? ' | ' : ''}${basicInfo.email}</span>` : ''}
                </div>
                <div style="font-size: 14px; color: #444; margin-top: 4px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                    ${hasBasic(basicInfo.linkedin) ? `<span>LinkedIn: ${basicInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</span>` : ''}
                    ${hasBasic(basicInfo.github) ? `<span>${hasBasic(basicInfo.linkedin) ? ' | ' : ''}GitHub: ${basicInfo.github.replace(/https?:\/\/(www\.)?/, '')}</span>` : ''}
                </div>
            </div>

            <hr style="border: none; border-top: 2px solid #333; margin-bottom: 20px;" />

            ${hasBasic(basicInfo.summary) ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #000;">Summary</h2>
                    <p style="margin: 0; font-size: 14px; text-align: justify; white-space: pre-line;">${basicInfo.summary}</p>
                </div>
            ` : ''}

            ${hasData(experience) ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #000;">Experience</h2>
                    ${experience.map(exp => `
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 15px;">
                                <span>${exp.role}</span>
                                <span>${exp.duration}</span>
                            </div>
                            <div style="font-style: italic; color: #444; margin-bottom: 4px; font-size: 14px;">${exp.company}</div>
                            ${hasBasic(exp.description) ? `<p style="margin: 0; font-size: 14px; white-space: pre-line;">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${hasData(projects) ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #000;">Projects</h2>
                    ${projects.map(proj => `
                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: bold; font-size: 15px;">
                                ${proj.title} ${hasBasic(proj.link) ? `<span style="font-weight: normal; font-size: 12px; color: #666; margin-left: 5px;">(${proj.link})</span>` : ''}
                            </div>
                            ${hasBasic(proj.description) ? `<p style="margin: 4px 0 0 0; font-size: 14px; white-space: pre-line;">${proj.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${hasData(education) ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #000;">Education</h2>
                    ${education.map(edu => `
                        <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                            <div>
                                <div style="font-weight: bold; font-size: 15px;">${edu.degree}</div>
                                <div style="font-size: 14px;">${edu.institution}${hasBasic(edu.grade) ? ` | Grade: ${edu.grade}` : ''}</div>
                            </div>
                            <div style="text-align: right; font-size: 14px;">${edu.year}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${hasData(achievements) ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #000;">Achievements</h2>
                    <ul style="padding-left: 20px; margin: 0;">
                        ${achievements.map(ach => `
                            <li style="font-size: 14px; margin-bottom: 4px;">${ach.description}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
};

interface Internship {
    id: string;
    title: string;
    company_name: string;
    stipend_min: number;
    stipend_max: number;
    is_unpaid: boolean;
    status: string;
}

interface ApplicationAnswer {
    id: string;
    question_text: string;
    answer_text: string | null;
    file_url: string | null;
}

interface Application {
    id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'offer_sent' | 'offer_accepted' | 'hired' | 'completed' | 'withdrawn';
    cover_note: string | null;
    resume_url: string | null;
    skillantra_resume_id?: string | null;
    linkedin_url: string | null;
    offer_letter_url: string | null;
    completion_letter_url: string | null;
    applied_at: string;
    student_id: string;
    profiles: {
        id: string;
        name: string;
        email: string | null;
        phone_number: string | null;
        degree_level: string | null;
        college: string | null;
        skills: string | null;
        bio: string | null;
    } | null;
    answers?: ApplicationAnswer[];
}

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: internshipId } = use(params);
    const router = useRouter();
    const { guardAction } = useDemoGuard();
    const supabase = createClient();

    const [internship, setInternship] = useState<Internship | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [degreeFilter, setDegreeFilter] = useState<string>('all');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Modals state
    const [selectedAnswers, setSelectedAnswers] = useState<ApplicationAnswer[] | null>(null);

    const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/internships/${internshipId}/applicants`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to load applications');
                return;
            }

            setInternship(data.internship);
            setApplications(data.applications || []);
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [internshipId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUpdateStatus = guardAction(async (applicationId: string, status: string, reason?: string) => {
        setActionId(applicationId);
        try {
            const res = await fetch(`/api/internship-applications/${applicationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to update status', 'error');
                return;
            }
            showToast(`Application ${status}`);
            setRejectingId(null);
            setRejectReason('');
            loadData();
        } catch {
            showToast('An unexpected error occurred', 'error');
        } finally {
            setActionId(null);
        }
    });


    const handleResumeView = (application: Application) => {
        if (application.resume_url) {
            window.open(application.resume_url, '_blank');
            return;
        }
        if (application.skillantra_resume_id) {
            window.open(`/resume/${application.profiles?.id}`, '_blank');
            return;
        }
        showToast('No resume available for this applicant', 'error');
    };

    if (loading) return <LoadingSpinner />;

    const filteredApplications = applications.filter((app) => {
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;
        if (degreeFilter !== 'all' && app.profiles?.degree_level?.toLowerCase() !== degreeFilter) return false;
        return true;
    });

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 opacity-0 animate-fade-in-up">
                <div className="bg-rose-900/40 border border-rose-800 text-rose-200 px-6 py-5 rounded-xl shadow-lg flex items-center gap-3">
                    <XCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-rose-100">Error Loading Data</h3>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
                <button onClick={() => router.push('/internships/mine')} className="mt-6 text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-2">
                    ← Back to Internships
                </button>
            </div>
        );
    }

    return (
        <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8 px-4 sm:px-6">
            {/* Toast rendering */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 text-sm px-5 py-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border animate-fade-in-up flex items-center gap-2 font-medium ${toast.type === 'error'
                    ? 'bg-rose-950 border-rose-800 text-rose-200'
                    : 'bg-emerald-950 border-emerald-800 text-emerald-200'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Answer Modal */}
            {selectedAnswers && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                Custom Answers
                            </h3>
                            <button onClick={() => setSelectedAnswers(null)} className="text-slate-500 hover:text-slate-300 p-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            {selectedAnswers.map((ans) => (
                                <div key={ans.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <h4 className="text-sm font-semibold text-indigo-300 mb-2">{ans.question_text}</h4>
                                    {ans.answer_text && <p className="text-slate-200 text-sm whitespace-pre-wrap">{ans.answer_text}</p>}
                                    {ans.file_url && (
                                        <a href={ans.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                                            <Download className="w-4 h-4" /> View Attached File
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 border-b border-slate-800 pb-6">
                <button
                    onClick={() => router.push('/internships/mine')}
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 text-sm transition-colors font-medium bg-indigo-500/10 px-3 py-1.5 rounded-full"
                >
                    ← Back to Dashboard
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mb-2 tracking-tight">
                            {internship?.title ?? 'Applicants'}
                        </h1>
                        {internship && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-400 text-sm">
                                <span className="font-medium text-slate-300">{internship.company_name}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">
                                    {internship.is_unpaid ? 'Unpaid' : `₹${internship.stipend_min.toLocaleString()}/mo`}
                                </span>
                                <span>•</span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">{applications.length} Applicants</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {applications.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none h-9 align-middle"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="offer_sent">Offer Sent</option>
                            <option value="offer_accepted">Offer Accepted</option>
                            <option value="hired">Hired</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400">Degree:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {['All', 'UG', 'PG'].map((deg) => (
                                <button
                                    key={deg}
                                    onClick={() => setDegreeFilter(deg.toLowerCase())}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--color-border)',
                                        background: degreeFilter === deg.toLowerCase() ? 'var(--color-accent)' : 'transparent',
                                        color: degreeFilter === deg.toLowerCase() ? '#fff' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}
                                >
                                    {deg}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )
            }

            {applications.length === 0 ? (
                <AppCard className="text-center p-12 border-dashed border-2 bg-slate-900/30">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <Users className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No Applications Yet</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">Applications will appear here once students start applying to your internship.</p>
                </AppCard>
            ) : filteredApplications.length === 0 ? (
                <AppCard className="text-center p-12 border-dashed border-2 bg-slate-900/30">
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No matching applicants</h3>
                </AppCard>
            ) : (
                <div className="space-y-6">
                    {filteredApplications.map((app, index) => (
                        <AppCard
                            key={app.id}
                            className={`opacity-0 animate-fade-in-up-delayed transition-all duration-300 ${actionId === app.id ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''}`}
                            style={{ animationDelay: `${index * 0.08}s` }}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                {/* Left Side: Applicant Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
                                                {app.profiles?.name || 'Unknown Candidate'}
                                                <StatusBadge status={app.status as any} />
                                                {app.profiles?.degree_level && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                        {app.profiles.degree_level}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                                    {app.profiles?.college || 'No college specified'}
                                                    <span className="text-slate-600">•</span>
                                                    Applied {formatTimeAgo(app.applied_at)}
                                                </p>
                                                {app.profiles?.email && (
                                                    <p className="text-slate-500 text-xs flex items-center gap-1.5">
                                                        <span className="font-semibold text-slate-400">Email:</span> {app.profiles.email}
                                                    </p>
                                                )}
                                                {app.profiles?.phone_number && (
                                                    <p className="text-slate-500 text-xs flex items-center gap-1.5">
                                                        <span className="font-semibold text-slate-400">Phone:</span> {app.profiles.phone_number}
                                                    </p>
                                                )}
                                            </div>
                                            {app.profiles?.skills && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {app.profiles.skills.split(',').map((skill, i) => (
                                                        skill.trim() && (
                                                            <span key={i} className="px-2 py-0.5 bg-slate-800/80 text-slate-400 text-[10px] font-medium rounded-md border border-slate-700/50">
                                                                {skill.trim()}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {app.cover_note && (
                                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cover Letter</h4>
                                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{app.cover_note}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {(app.resume_url || app.skillantra_resume_id) && (
                                            <button
                                                onClick={() => handleResumeView(app)}
                                                className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium border border-blue-500/20 transition-colors"
                                            >
                                                <FileText className="w-4 h-4" /> View Resume
                                            </button>
                                        )}
                                        {app.linkedin_url && (
                                            <a
                                                href={app.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 px-4 py-2 rounded-lg text-sm font-medium border border-sky-500/20 transition-colors"
                                            >
                                                <Linkedin className="w-4 h-4" /> LinkedIn Profile
                                            </a>
                                        )}
                                        <button
                                            onClick={() => router.push(`/profile/${app.profiles?.id}?from=internship&internshipId=${internshipId}`)}
                                            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
                                        >
                                            <Users className="w-4 h-4" /> View Profile (Portfolio)
                                        </button>
                                        {app.answers && app.answers.length > 0 && (
                                            <button
                                                onClick={() => setSelectedAnswers(app.answers || null)}
                                                className="inline-flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-500/20 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" /> View Answers ({app.answers.length})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Actions */}
                                <div className="lg:w-64 shrink-0 flex flex-col gap-3 lg:border-l lg:border-slate-800 lg:pl-6">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:block mb-1">Actions</h4>

                                    {app.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Accept Candidate
                                            </button>
                                            {rejectingId === app.id ? (
                                                <div className="space-y-2 group">
                                                    <textarea
                                                        placeholder="Reason for rejection (optional)"
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 min-h-[80px] resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(app.id, 'rejected', rejectReason)}
                                                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Confirm Reject
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setRejectingId(app.id)}
                                                    className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-900 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {app.status === 'accepted' && (
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center space-y-3">
                                            <p className="text-indigo-300 text-xs font-medium">Candidate Accepted!</p>
                                            {app.profiles?.email && (
                                                <a
                                                    href={`mailto:${app.profiles.email}`}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Email Candidate
                                                </a>
                                            )}
                                            <button
                                                onClick={() => router.push(`/profile/${app.profiles?.id}`)}
                                                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                                            >
                                                <Users className="w-4 h-4" /> Message Candidate
                                            </button>
                                        </div>
                                    )}

                                    {app.status === 'offer_sent' && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                                            <p className="text-amber-400 text-sm font-medium mb-1">Offer Letter Sent</p>
                                            <p className="text-slate-400 text-xs">Waiting for student to accept the offer.</p>
                                        </div>
                                    )}

                                    {app.status === 'hired' && (
                                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                                            <div className="mx-auto w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 border border-emerald-500/30">
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <p className="text-slate-200 text-sm font-medium">Candidate is hired.</p>
                                        </div>
                                    )}

                                    {app.status === 'completed' && (
                                        <div className="text-center p-4">
                                            <div className="mx-auto w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 border border-emerald-500/30 mt-2">
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <p className="text-emerald-400 font-medium">Internship Completed</p>
                                        </div>
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
