'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';

interface Task {
  id: string;
  creator_profile_id: string;
  title: string;
  description: string | null;
  skills_required: string | null;
  stipend_min: number | null;
  stipend_max: number | null;
  status: 'open' | 'closed';
  created_at: string;
  creator?: {
    id: string;
    name: string;
    phone_number: string | null;
  };
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{task.title}</h1>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
                  task.status === 'open'
                    ? 'bg-green-500/20 text-green-300 border border-green-400/50'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-400/50'
                }`}
              >
                {task.status}
              </span>
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
        </div>

        {task.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

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

        {(task.stipend_min !== null || task.stipend_max !== null) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Stipend</h2>
            <p className="text-green-300 font-semibold text-xl">
              {task.stipend_min !== null && task.stipend_max !== null
                ? `₹${task.stipend_min.toLocaleString()} - ₹${task.stipend_max.toLocaleString()}`
                : task.stipend_min !== null
                ? `₹${task.stipend_min.toLocaleString()}+`
                : `Up to ₹${task.stipend_max?.toLocaleString()}`}
            </p>
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

