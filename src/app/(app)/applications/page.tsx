'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { useCountdown } from '@/lib/utils/useCountdown';
import type { Task } from '@/lib/types';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskApplication {
  id: string;
  task_id: string;
  applicant_profile_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  task?: Task & {
    creator?: {
      id: string;
      name: string;
      phone_number: string | null;
    };
  };
}

interface InternshipApplication {
  id: string;
  internship_id: string;
  applicant_profile_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'hired';
  cover_note: string | null;
  created_at: string;
  internship?: {
    id: string;
    role_title: string;
    company_name: string | null;
    company_logo_url: string | null;
    stipend_amount: number;
    duration_weeks: number;
    work_mode: string;
  };
}

type TabId = 'tasks' | 'internships';

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
  remote: '🏠 Remote', Remote: '🏠 Remote',
  hybrid: '🔄 Hybrid', Hybrid: '🔄 Hybrid',
  onsite: '🏢 On-site', 'On-site': '🏢 On-site',
};

function logoColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
  return LOGO_COLORS[h % LOGO_COLORS.length];
}

// ─── Small reusable components ─────────────────────────────────────────────────

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const countdown = useCountdown(deadline);
  if (!countdown) return null;
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${countdown.expired
        ? 'bg-rose-900/50 text-rose-400 border border-rose-800'
        : 'bg-amber-900/50 text-amber-400 border border-amber-800'
      }`}>
      ⏰ {countdown.text}
    </span>
  );
}

function CompanyLogo({
  logoUrl, companyName, roleTitle,
}: {
  logoUrl: string | null; companyName: string | null; roleTitle: string;
}) {
  const [err, setErr] = useState(false);
  const letter = (companyName ?? roleTitle).charAt(0).toUpperCase();
  const cls = logoColor(roleTitle);

  if (logoUrl && !err) {
    return (
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
        <Image src={logoUrl} alt={companyName ?? 'Logo'} width={44} height={44}
          className="w-full h-full object-cover" onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold ${cls}`}>
      {letter}
    </div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({
  active,
  taskCount,
  internshipCount,
  onSelect,
}: {
  active: TabId;
  taskCount: number;
  internshipCount: number;
  onSelect: (tab: TabId) => void;
}) {
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'tasks', label: 'Tasks', count: taskCount },
    { id: 'internships', label: 'Internships', count: internshipCount },
  ];

  return (
    <div className="flex gap-1 p-1 bg-slate-900/60 border border-slate-800 rounded-xl mb-6 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active === tab.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${active === tab.id
                ? 'bg-indigo-400/30 text-indigo-100'
                : 'bg-slate-700 text-slate-400'
              }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Task Applications Tab ─────────────────────────────────────────────────────

function TasksTab({ isDemo }: { isDemo: boolean }) {
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setApplications([
        {
          id: 'demo-app-1',
          task_id: 'demo-task-1',
          applicant_profile_id: 'demo-user',
          status: 'pending',
          created_at: new Date().toISOString(),
          task: {
            id: 'demo-task-1',
            creator_profile_id: 'demo-creator',
            title: 'Build a React Dashboard',
            description: 'Looking for a frontend developer to help build a modern dashboard.',
            skills_required: 'React, TypeScript',
            payment_type: 'stipend',
            stipend_min: 5000,
            stipend_max: 10000,
            payment_other_details: null,
            application_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            mode_of_work: 'remote',
            attachments: [],
            status: 'open',
            created_at: new Date().toISOString(),
          },
        },
      ]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/applications?sent=true');
        const data = await response.json();
        if (!response.ok) {
          if (data.error?.includes('schema cache') || data.error?.includes('does not exist')) {
            setApplications([]);
            setError('Applications feature is not available yet. Database tables need to be initialized.');
            setLoading(false);
            return;
          }
          setError(data.error || 'Failed to load applications');
          return;
        }
        setApplications(data.applications || []);
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    })();
  }, [isDemo]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <AppCard className="text-center p-8">
        <p className="text-slate-400 mb-4 text-lg">You haven't applied to any tasks yet.</p>
        <Link href="/tasks" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group">
          Browse available tasks <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
        </Link>
      </AppCard>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application, index) => (
        <AppCard
          key={application.id}
          className="opacity-0 animate-fade-in-up-delayed border-slate-800"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          {application.task && (
            <>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">
                    {application.task.title}
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={application.status} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Task:</span>
                      <StatusBadge status={application.task.status} />
                    </div>
                    {application.task.application_deadline && (
                      <DeadlineCountdown deadline={application.task.application_deadline} />
                    )}
                  </div>
                </div>
              </div>

              {application.task.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {application.task.description}
                </p>
              )}

              {application.task.skills_required && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Skills Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {application.task.skills_required
                      .split(',')
                      .slice(0, 5)
                      .map((skill, i) => (
                        <span
                          key={i}
                          className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md border border-slate-700 font-medium"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {application.task?.creator && (
                <div className="mb-4 p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Task Creator:</p>
                  <Link
                    href={`/profile/${application.task.creator.id}`}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                  >
                    👤 View {application.task.creator.name}&apos;s Profile
                  </Link>
                </div>
              )}

              {application.status === 'accepted' && application.task?.creator?.phone_number && (
                <div className="mb-4 p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Contact Information:</p>
                  <p className="text-sm text-slate-200 font-medium">{application.task.creator.name}</p>
                  <p className="text-sm text-emerald-400 font-medium mt-1">
                    📞 +91 {application.task.creator.phone_number}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500">
                  Applied {formatTimeAgo(application.created_at)}
                </div>
                <Link
                  href={`/tasks/${application.task.id}`}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium group inline-flex items-center gap-1"
                >
                  View Task <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
            </>
          )}
        </AppCard>
      ))}
    </div>
  );
}

// ─── Internship Applications Tab ───────────────────────────────────────────────

function InternshipsTab() {
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        // Get current user profile id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please sign in to view your applications.');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }

        // Fetch internship applications joined with the internship row
        const { data, error: sbError } = await supabase
          .from('task_applications')
          .select(`
            id,
            internship_id,
            applicant_profile_id,
            status,
            cover_note,
            created_at,
            internship:internships!task_applications_internship_id_fkey (
              id,
              role_title,
              company_name,
              company_logo_url,
              stipend_amount,
              duration_weeks,
              work_mode
            )
          `)
          .eq('applicant_profile_id', profile.id)
          .not('internship_id', 'is', null)
          .order('created_at', { ascending: false });

        if (sbError) {
          // If the FK hint doesn't match, fall back to a simpler query
          if (sbError.message?.includes('relationship') || sbError.message?.includes('hint')) {
            const { data: fallbackData, error: fallbackErr } = await supabase
              .from('task_applications')
              .select('id, internship_id, applicant_profile_id, status, cover_note, created_at')
              .eq('applicant_profile_id', profile.id)
              .not('internship_id', 'is', null)
              .order('created_at', { ascending: false });

            if (fallbackErr) {
              setError(fallbackErr.message);
              return;
            }

            // Enrich with internship data manually
            const ids = (fallbackData ?? []).map((r: any) => r.internship_id).filter(Boolean);
            let internshipMap: Record<string, any> = {};
            if (ids.length > 0) {
              const { data: internships } = await supabase
                .from('internships')
                .select('id, role_title, company_name, company_logo_url, stipend_amount, duration_weeks, work_mode')
                .in('id', ids);
              (internships ?? []).forEach((i: any) => { internshipMap[i.id] = i; });
            }

            const enriched = (fallbackData ?? []).map((row: any) => ({
              ...row,
              internship: internshipMap[row.internship_id] ?? null,
            }));
            setApplications(enriched as InternshipApplication[]);
            return;
          }
          setError(sbError.message);
          return;
        }

        // Normalize: Supabase may return the FK join as an array
        const normalized = (data ?? []).map((row: any) => ({
          ...row,
          internship: Array.isArray(row.internship) ? row.internship[0] ?? null : row.internship,
        }));
        setApplications(normalized as InternshipApplication[]);
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <AppCard className="text-center p-8">
        <p className="text-slate-400 mb-4 text-lg">You haven't applied to any internships yet.</p>
        <Link href="/internships" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group">
          Browse internships <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
        </Link>
      </AppCard>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application, index) => {
        const intern = application.internship;
        const isHired = application.status === 'hired';

        return (
          <AppCard
            key={application.id}
            className="opacity-0 animate-fade-in-up-delayed border-slate-800"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            {/* Header: logo + title + company + status */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <CompanyLogo
                  logoUrl={intern?.company_logo_url ?? null}
                  companyName={intern?.company_name ?? null}
                  roleTitle={intern?.role_title ?? '?'}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-100 leading-snug truncate mb-1">
                    {intern?.role_title ?? 'Internship'}
                  </h3>
                  {intern?.company_name && (
                    <p className="text-slate-400 text-sm truncate">{intern.company_name}</p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 ml-3">
                <StatusBadge status={application.status} />
              </div>
            </div>

            {/* Internship quick stats */}
            {intern && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Stipend */}
                <span className={`text-xs font-semibold ${intern.stipend_amount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {intern.stipend_amount > 0
                    ? `₹${intern.stipend_amount.toLocaleString('en-IN')}/mo`
                    : 'Unpaid'}
                </span>
                <span className="text-slate-700">·</span>
                {/* Duration */}
                <span className="text-xs text-slate-400 font-medium bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                  ⏱ {intern.duration_weeks}w
                </span>
                {/* Work mode */}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${WORK_MODE_BADGE[intern.work_mode] ?? 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                  {WORK_MODE_LABEL[intern.work_mode] ?? intern.work_mode}
                </span>
              </div>
            )}

            {/* Cover note snippet */}
            {application.cover_note && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed italic">
                &ldquo;{application.cover_note}&rdquo;
              </p>
            )}

            {/* Footer: time ago + CTA */}
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-500">
                Applied {formatTimeAgo(application.created_at)}
              </div>
              {isHired ? (
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-all duration-150 active:scale-[0.97]"
                >
                  💬 Open Chat →
                </Link>
              ) : intern ? (
                <Link
                  href={`/internships/${application.internship_id}`}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium group inline-flex items-center gap-1"
                >
                  View Listing <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              ) : null}
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MyApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isDemo = searchParams?.get('demo') === 'true';
  const tabParam = searchParams?.get('tab');
  const activeTab: TabId = tabParam === 'internships' ? 'internships' : 'tasks';

  // We track counts lazily; start with 0, tabs self-load
  const [taskCount, setTaskCount] = useState(0);
  const [internshipCount, setInternshipCount] = useState(0);

  const handleTabSelect = useCallback((tab: TabId) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (tab === 'tasks') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  return (
    <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-2">
          My Applications
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Track all your task and internship applications
        </p>
      </div>

      {/* Tab bar */}
      <TabBar
        active={activeTab}
        taskCount={taskCount}
        internshipCount={internshipCount}
        onSelect={handleTabSelect}
      />

      {/* Tab content — always mounted but hidden so they don't reload on tab switch */}
      <div className={activeTab === 'tasks' ? 'block' : 'hidden'}>
        <TasksTab isDemo={isDemo} />
      </div>
      <div className={activeTab === 'internships' ? 'block' : 'hidden'}>
        <InternshipsTab />
      </div>
    </div>
  );
}
