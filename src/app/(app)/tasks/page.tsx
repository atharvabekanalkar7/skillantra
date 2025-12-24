'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import PhoneNumberModal from '@/components/PhoneNumberModal';
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
  creator_profile?: {
    id: string;
    name: string;
  };
}

export default function BrowseTasksPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTaskId, setApplyingTaskId] = useState<string | null>(null);
  const [appliedTaskIds, setAppliedTaskIds] = useState<Set<string>>(new Set());
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    if (!isDemo) {
      loadAppliedTasks();
    }
  }, [isDemo]);

  const loadTasks = async () => {
    if (isDemo) {
      // Demo mode: use mock data
      setTasks([
        {
          id: 'demo-1',
          creator_profile_id: 'demo-creator',
          title: 'Build a React Dashboard',
          description: 'Looking for a frontend developer to help build a modern dashboard with React and TypeScript.',
          skills_required: 'React, TypeScript, Tailwind CSS',
          stipend_min: 5000,
          stipend_max: 10000,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          creator_profile_id: 'demo-creator-2',
          title: 'Design Mobile App UI',
          description: 'Need a UI/UX designer for a mobile app project.',
          skills_required: 'Figma, UI/UX Design',
          stipend_min: 3000,
          stipend_max: 8000,
          status: 'open',
          created_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();

      if (!response.ok) {
        // Handle table not found gracefully
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

  const loadAppliedTasks = async () => {
    try {
      const response = await fetch('/api/applications?sent=true');
      const data = await response.json();
      
      if (response.ok && data.applications) {
        const appliedIds = new Set<string>(data.applications.map((app: { task_id: string }) => app.task_id));
        setAppliedTaskIds(appliedIds);
      }
    } catch (err) {
      console.error('Error loading applied tasks:', err);
    }
  };

  const handleSavePhoneNumber = async (phoneNumber: string) => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save phone number');
    }
  };

  const applyToTask = async (taskId: string) => {
    setApplyingTaskId(taskId);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PHONE_NUMBER_REQUIRED') {
          setApplyingTaskId(null);
          setPendingTaskId(taskId);
          setShowPhoneModal(true);
          return;
        }
        alert(data.error || 'Failed to apply to task');
        return;
      }

      alert('Application submitted successfully!');
      // Update applied tasks list
      setAppliedTaskIds(prev => new Set([...prev, taskId]));
      // Reload tasks to refresh UI
      await loadTasks();
    } catch (err) {
      alert('An unexpected error occurred');
      console.error('Error applying to task:', err);
    } finally {
      setApplyingTaskId(null);
    }
  };

  const handleApply = async (taskId: string) => {
    if (isDemo) {
      alert('Demo mode: Application feature not available. Sign up to apply to tasks!');
      return;
    }

    await applyToTask(taskId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Browse Tasks</h1>
          <p className="text-white/80">Find tasks that match your skills</p>
        </div>
        <Link
          href="/tasks/new"
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 hover:scale-105 font-semibold shadow-lg shadow-green-900/30"
        >
          Create Task
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-md">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 text-center border border-purple-400/30">
          <p className="text-white/80 mb-4 text-lg">No open tasks available at the moment.</p>
          <Link
            href="/tasks/new"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 font-semibold group"
          >
            Be the first to create a task <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] opacity-0 animate-fade-in-up-delayed"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-white pr-2">{task.title}</h3>
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

              {task.description && (
                <p className="text-white/70 text-sm mb-4 line-clamp-3 leading-relaxed">{task.description}</p>
              )}

              {task.skills_required && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wide">Skills Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {task.skills_required
                      .split(',')
                      .map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-lg border border-blue-400/30 font-medium"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {(task.stipend_min !== null || task.stipend_max !== null) && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-white/60 mb-1 uppercase tracking-wide">Stipend:</p>
                  <p className="text-green-300 font-semibold">
                    {task.stipend_min !== null && task.stipend_max !== null
                      ? `₹${task.stipend_min.toLocaleString()} - ₹${task.stipend_max.toLocaleString()}`
                      : task.stipend_min !== null
                      ? `₹${task.stipend_min.toLocaleString()}+`
                      : `Up to ₹${task.stipend_max?.toLocaleString()}`}
                  </p>
                </div>
              )}

              {task.creator_profile && (
                <div className="text-xs text-white/50 mb-2">
                  Created by{' '}
                  <Link
                    href={`/profile/${task.creator_profile.id}`}
                    className="text-purple-300 hover:text-purple-200 font-semibold hover:underline"
                  >
                    {task.creator_profile.name}
                  </Link>
                </div>
              )}

              <div className="text-xs text-white/50 mb-4">
                {formatTimeAgo(task.created_at)}
              </div>

              <button
                onClick={() => handleApply(task.id)}
                disabled={
                  applyingTaskId === task.id || 
                  task.status !== 'open' || 
                  appliedTaskIds.has(task.id)
                }
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] font-semibold shadow-lg shadow-blue-900/30"
              >
                {isDemo 
                  ? 'Sign Up to Apply' 
                  : appliedTaskIds.has(task.id)
                  ? 'Already Applied'
                  : applyingTaskId === task.id 
                  ? 'Applying...' 
                  : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      )}

      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={() => {
          setShowPhoneModal(false);
          setPendingTaskId(null);
        }}
        context="apply_task"
        onSave={async (phoneNumber) => {
          await handleSavePhoneNumber(phoneNumber);
          setShowPhoneModal(false);
          // Retry application after saving phone number
          if (pendingTaskId) {
            await applyToTask(pendingTaskId);
            setPendingTaskId(null);
          }
        }}
      />
    </div>
  );
}

