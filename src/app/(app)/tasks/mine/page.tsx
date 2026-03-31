'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { useCountdown } from '@/lib/utils/useCountdown';
import type { Task, TaskApplication } from '@/lib/types';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';

const MODE_LABELS: Record<string, string> = {
  remote: '🏠 Remote',
  hybrid: '🔄 Hybrid',
  'in-person': '🏢 In-person',
};

// Deadline display component
function DeadlineCountdown({ deadline }: { deadline: string }) {
  const countdown = useCountdown(deadline);
  if (!countdown) return null;
  return (
    <span className={`text-xs font-semibold ${countdown.expired ? 'text-red-400' : 'text-amber-300'}`}>
      ⏰ {countdown.text}
    </span>
  );
}

interface Application {
  id: string;
  task_id: string;
  applicant_profile_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  applicant?: {
    id: string;
    name: string;
    college: string | null;
    phone_number: string | null;
  };
}

const TASK_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  project: { label: 'Project', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  research: { label: 'Research', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  competition: { label: 'Competition', color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function MyTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationsByTask, setApplicationsByTask] = useState<Record<string, Application[]>>({});
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    if (!isDemo) {
      loadApplications();
    }
  }, [isDemo]);

  const loadTasks = async () => {
    if (isDemo) {
      setTasks([
        {
          id: 'demo-mine-1',
          creator_profile_id: 'demo-user',
          title: 'Build a Full Stack Portfolio Platform',
          description: 'This is a demo project you are currently leading. Looking for React + Node.js developers.',
          skills_required: 'React, Node.js, MongoDB',
          task_type: 'project',
          payment_type: 'stipend',
          stipend_min: 5000,
          stipend_max: 8000,
          payment_other_details: null,
          application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          mode_of_work: 'remote',
          attachments: [],
          status: 'open',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      setApplicationsByTask({
        'demo-mine-1': [
          {
            id: 'demo-app-1',
            task_id: 'demo-mine-1',
            applicant_profile_id: 'demo-applicant-1',
            status: 'pending',
            created_at: new Date().toISOString(),
            applicant: {
              id: 'demo-applicant-1',
              name: 'Demo Applicant',
              college: 'IIT Mandi',
              phone_number: null,
            },
          },
        ]
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks?mine=true');
      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('schema cache') || data.error?.includes('does not exist')) {
          setTasks([]);
          setError('Tasks feature is not available yet. Database tables need to be initialized.');
          setLoading(false);
          return;
        }
        setError(data.error || 'Failed to load tasks');
        return;
      }

      setTasks(data.tasks || []);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications?received=true');
      const data = await response.json();

      if (response.ok && data.applications) {
        const grouped: Record<string, Application[]> = {};
        data.applications.forEach((app: Application) => {
          if (!grouped[app.task_id]) {
            grouped[app.task_id] = [];
          }
          grouped[app.task_id].push(app);
        });
        setApplicationsByTask(grouped);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    if (isDemo) {
      alert('Demo mode: Cannot update application status. Sign up to manage applications!');
      return;
    }

    setUpdatingApplicationId(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update application status');
        return;
      }

      await loadApplications();
    } catch (err) {
      alert('An unexpected error occurred');
      console.error('Error updating application status:', err);
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isDemo) {
      alert('Demo mode: Cannot delete tasks. Sign up to manage tasks!');
      return;
    }

    if (confirmDeleteId !== taskId) {
      setConfirmDeleteId(taskId);
      return;
    }

    setDeletingTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to delete task');
        setConfirmDeleteId(null);
        return;
      }

      await loadTasks();
      setConfirmDeleteId(null);
    } catch (err) {
      alert('An unexpected error occurred');
      console.error('Error deleting task:', err);
      setConfirmDeleteId(null);
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-2">My Tasks</h1>
          <p className="text-slate-400 text-sm sm:text-base">Manage tasks you've created</p>
        </div>
        <Link
          href="/tasks/new"
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.02] font-medium touch-manipulation"
        >
          Create New Task
        </Link>
      </div>

      {error && (
        <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <AppCard className="text-center p-8">
          <p className="text-slate-400 mb-4 text-lg">You haven't created any tasks yet.</p>
          <Link
            href="/tasks/new"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group"
          >
            Create your first task <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
          </Link>
        </AppCard>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <AppCard
              key={task.id}
              className="opacity-0 animate-fade-in-up-delayed"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center gap-3 mb-1 wrap">
                      <h3 className="text-lg font-bold text-slate-100">{task.title}</h3>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.task_type && TASK_TYPE_CONFIG[task.task_type] && (
                      <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter ${TASK_TYPE_CONFIG[task.task_type].color} ${TASK_TYPE_CONFIG[task.task_type].bg} px-2 py-0.5 rounded-full border border-white/5 w-fit`}>
                        {TASK_TYPE_CONFIG[task.task_type].label}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {task.mode_of_work && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {MODE_LABELS[task.mode_of_work] || task.mode_of_work}
                      </span>
                    )}
                  </div>
                  {applicationsByTask[task.id] && applicationsByTask[task.id].length > 0 && (
                    <p className="text-sm text-indigo-400 font-medium">
                      {applicationsByTask[task.id].length} application{applicationsByTask[task.id].length !== 1 ? 's' : ''} received
                    </p>
                  )}
                </div>
              </div>

              {task.description && (
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{task.description}</p>
              )}

              {task.skills_required && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Skills Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {task.skills_required
                      .split(',')
                      .map((skill, i) => (
                        <span
                          key={i}
                          className="inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-lg border border-slate-700 font-medium"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Payment */}
              {task.payment_type === 'stipend' && task.stipend_min !== null && task.stipend_max !== null && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Stipend:</p>
                  <p className="text-emerald-400 font-medium text-sm">
                    ₹{task.stipend_min.toLocaleString()} – ₹{task.stipend_max.toLocaleString()}
                  </p>
                </div>
              )}
              {task.payment_type === 'other' && task.payment_other_details && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Compensation:</p>
                  <p className="text-emerald-400 font-medium text-sm">{task.payment_other_details}</p>
                </div>
              )}
              {!task.payment_type && (task.stipend_min !== null || task.stipend_max !== null) && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Stipend:</p>
                  <p className="text-emerald-400 font-medium text-sm">
                    {task.stipend_min !== null && task.stipend_max !== null
                      ? `₹${task.stipend_min.toLocaleString()} – ₹${task.stipend_max.toLocaleString()}`
                      : task.stipend_min !== null
                        ? `₹${task.stipend_min.toLocaleString()}+`
                        : `Up to ₹${task.stipend_max?.toLocaleString()}`}
                  </p>
                </div>
              )}

              {/* Deadline */}
              {task.application_deadline && (
                <div className="mb-3">
                  <DeadlineCountdown deadline={task.application_deadline} />
                </div>
              )}

              {/* Applications Section */}
              {applicationsByTask[task.id] && applicationsByTask[task.id].length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-100 mb-3">Applications:</h4>
                  <div className="space-y-3">
                    {applicationsByTask[task.id].map((application) => (
                      <div
                        key={application.id}
                        className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-slate-200 font-medium">
                                {application.applicant?.name || 'Unknown User'}
                              </p>
                              {application.applicant?.id && (
                                <Link
                                  href={`/profile/${application.applicant.id}`}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                                >
                                  👤 View Profile
                                </Link>
                              )}
                            </div>
                            {application.applicant?.college && (
                              <p className="text-xs text-slate-400 mt-0.5">{application.applicant.college}</p>
                            )}
                            {application.status === 'accepted' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {application.applicant?.phone_number && (
                                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary, #94a3b8)' }}>
                                    📞 +91 {application.applicant.phone_number}
                                  </span>
                                )}
                                <button
                                  onClick={() => router.push(`/profile/${application.applicant?.id}`)}
                                  style={{
                                    padding: '5px 14px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
                                    color: '#f8fafc',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    border: '1px solid #4f46e5',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Message
                                </button>
                                {(application as any).applicant_email && (
                                  <a
                                    href={`mailto:${(application as any).applicant_email}`}
                                    style={{
                                      padding: '5px 14px',
                                      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                                      color: '#94a3b8',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      border: '1px solid #334155',
                                      textDecoration: 'none',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    Email
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={application.status} />
                        </div>
                        {application.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'accepted')}
                              disabled={updatingApplicationId === application.id}
                              className="flex-1 min-h-[36px] bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white py-1.5 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
                            >
                              {updatingApplicationId === application.id ? 'Updating...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                              disabled={updatingApplicationId === application.id}
                              className="flex-1 min-h-[36px] bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white py-1.5 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
                            >
                              {updatingApplicationId === application.id ? 'Updating...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500">
                  {formatTimeAgo(task.created_at)}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="text-amber-500 hover:text-amber-400 text-sm font-medium group inline-flex items-center gap-1"
                  >
                    ✏️ Edit
                  </Link>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium group inline-flex items-center gap-1"
                  >
                    View Details <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={deletingTaskId === task.id}
                    className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${confirmDeleteId === task.id
                      ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-600'
                      : 'text-rose-400 hover:text-rose-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {deletingTaskId === task.id
                      ? 'Deleting...'
                      : confirmDeleteId === task.id
                        ? 'Confirm Delete'
                        : 'Delete'}
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
