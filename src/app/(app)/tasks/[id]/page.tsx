'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { useCountdown } from '@/lib/utils/useCountdown';
import type { Task } from '@/lib/types';
import SendDMButton from '@/components/SendDMButton';

const MODE_LABELS: Record<string, string> = {
  remote: '🏠 Remote',
  hybrid: '🔄 Hybrid',
  'in-person': '🏢 In-person',
};

const CATEGORY_ICONS: Record<string, string> = {
  GitHub: '🔗',
  Figma: '🎨',
  Notion: '📝',
  'Google Drive': '📁',
  Other: '🌐',
};

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const countdown = useCountdown(task?.application_deadline);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load task');
        return;
      }

      setTask(data.task);

      // Check ownership
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile?.id === data.task.creator_profile_id) {
            setIsOwner(true);
          }
        }
      } catch {
        // ignore - just can't show edit button
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading task:', err);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !task) {
    return (
      <div className="opacity-0 animate-fade-in-up">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-md">
          {error || 'Task not found'}
        </div>
        <Link
          href="/tasks"
          className="text-purple-300 hover:text-purple-200 font-semibold"
        >
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fade-in-up max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/tasks"
          className="text-purple-300 hover:text-purple-200 text-sm font-semibold inline-flex items-center gap-1 mb-4 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to Tasks
        </Link>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-purple-400/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{task.title}</h1>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${task.status === 'open'
                  ? 'bg-green-500/20 text-green-300 border border-green-400/50'
                  : 'bg-gray-500/20 text-gray-300 border border-gray-400/50'
                  }`}
              >
                {task.status}
              </span>
              {/* Mode of Work */}
              {task.mode_of_work && (
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  {MODE_LABELS[task.mode_of_work] || task.mode_of_work}
                </span>
              )}
            </div>
            {task.creator && (
              <p className="text-white/70 text-sm mb-2">
                Created by{' '}
                <Link
                  href={`/profile/${task.creator.id}`}
                  className="font-semibold text-purple-300 hover:text-purple-200 hover:underline"
                >
                  {task.creator.name}
                </Link>
              </p>
            )}
            <p className="text-xs text-white/50">
              {formatTimeAgo(task.created_at)}
            </p>
          </div>

          {/* Edit button for owner */}
          {isOwner && (
            <Link
              href={`/tasks/${task.id}/edit`}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all duration-300 active:scale-[0.98] font-semibold shadow-lg touch-manipulation text-sm"
            >
              ✏️ Edit Task
            </Link>
          )}

          {/* Apply button for applicants */}
          {!isOwner && task.status === 'open' && task.creator && (
            <div className="mt-4 sm:mt-0">
              <SendDMButton receiverId={task.creator.id} receiverName={task.creator.name} />
            </div>
          )}
        </div>

        {/* Task Creator Profile Preview */}
        {!isOwner && task.creator && (
          <div className="mb-8 p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-1">About the Task Creator</h2>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-semibold text-white">{task.creator.name}</span>
                  {task.creator.user_type && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {task.creator.user_type}
                    </span>
                  )}
                </div>
                {task.creator.college && (
                  <p className="text-sm text-white/60 mb-3 flex items-center gap-1">
                    <span>🎓</span> {task.creator.college}
                  </p>
                )}

                {task.creator.bio && (
                  <p className="text-sm text-white/80 leading-relaxed max-w-2xl mb-4 italic">
                    "{task.creator.bio}"
                  </p>
                )}

                {task.creator.skills && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {task.creator.skills.split(',').slice(0, 5).map((skill: string, idx: number) => (
                      <span key={idx} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70">
                        {skill.trim()}
                      </span>
                    ))}
                    {task.creator.skills.split(',').length > 5 && (
                      <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/50">
                        +{task.creator.skills.split(',').length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-end">
                {task.creator.created_at && (
                  <span className="text-xs text-white/40 mb-3">
                    Member since {new Date(task.creator.created_at).getFullYear()}
                  </span>
                )}
                <Link
                  href={`/profile/${task.creator.id}`}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-purple-200 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                >
                  View Full Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Skills */}
        {task.skills_required && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {task.skills_required
                .split(',')
                .map((skill, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-500/20 text-blue-200 text-sm px-4 py-2 rounded-lg border border-blue-400/30 font-medium"
                  >
                    {skill.trim()}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Payment */}
        {task.payment_type === 'stipend' && task.stipend_min !== null && task.stipend_max !== null && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Stipend</h2>
            <p className="text-green-300 font-semibold text-xl">
              ₹{task.stipend_min.toLocaleString()} – ₹{task.stipend_max.toLocaleString()}
            </p>
          </div>
        )}
        {task.payment_type === 'other' && task.payment_other_details && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Compensation</h2>
            <p className="text-green-300 font-semibold text-xl">{task.payment_other_details}</p>
          </div>
        )}
        {/* Backward compat */}
        {!task.payment_type && (task.stipend_min !== null || task.stipend_max !== null) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Stipend</h2>
            <p className="text-green-300 font-semibold text-xl">
              {task.stipend_min !== null && task.stipend_max !== null
                ? `₹${task.stipend_min.toLocaleString()} – ₹${task.stipend_max.toLocaleString()}`
                : task.stipend_min !== null
                  ? `₹${task.stipend_min.toLocaleString()}+`
                  : `Up to ₹${task.stipend_max?.toLocaleString()}`}
            </p>
          </div>
        )}

        {/* Deadline */}
        {task.application_deadline && countdown && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Application Deadline</h2>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-white/60">
                {new Date(task.application_deadline).toLocaleString()}
              </p>
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${countdown.expired
                ? 'bg-red-500/20 text-red-300 border border-red-400/50'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                }`}>
                ⏰ {countdown.text}
              </span>
            </div>
          </div>
        )}

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
            <div className="space-y-2">
              {task.attachments.map((att, index) => (
                <a
                  key={index}
                  href={att.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-purple-400/20 hover:border-purple-400/40 hover:bg-slate-800/60 transition-all group"
                >
                  <span className="text-lg flex-shrink-0">{CATEGORY_ICONS[att.category] || '🌐'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-purple-200 group-hover:text-purple-100">{att.category}</p>
                    <p className="text-xs text-white/50 truncate">{att.link}</p>
                  </div>
                  <span className="text-white/40 group-hover:text-white/60 flex-shrink-0">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-purple-400/20">
          <Link
            href="/tasks"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 font-semibold group"
          >
            ← Back to Tasks
          </Link>
        </div>
      </div>


    </div>
  );
}
