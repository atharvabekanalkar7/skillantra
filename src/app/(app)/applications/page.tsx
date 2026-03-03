'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { useCountdown } from '@/lib/utils/useCountdown';
import type { Task } from '@/lib/types';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';

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

interface Application {
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

export default function MyApplicationsPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [isDemo]);

  const loadApplications = async () => {
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
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-2">My Applications</h1>
        <p className="text-slate-400 text-sm sm:text-base">Track your task applications</p>
      </div>

      {error && (
        <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <AppCard className="text-center p-8">
          <p className="text-slate-400 mb-4 text-lg">You haven't applied to any tasks yet.</p>
          <Link
            href="/tasks"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium group"
          >
            Browse available tasks <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
          </Link>
        </AppCard>
      ) : (
        <div className="space-y-4">
          {applications.map((application, index) => (
            <AppCard
              key={application.id}
              className="opacity-0 animate-fade-in-up-delayed border-slate-800"
              style={{ animationDelay: `${index * 0.1}s` }}
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
                        {/* Deadline status */}
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
                      <p className="text-sm text-slate-200 font-medium">
                        {application.task.creator.name}
                      </p>
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
      )}
    </div>
  );
}
