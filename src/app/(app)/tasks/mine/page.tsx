'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Task {
  id: string;
  creator_profile_id: string;
  title: string;
  description: string | null;
  skills_required: string | null;
  status: 'open' | 'closed';
  created_at: string;
}

export default function MyTasksPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTasks();
    if (!isDemo) {
      loadApplications();
    }
  }, [isDemo]);

  const loadTasks = async () => {
    if (isDemo) {
      // Demo mode: use mock data
      setTasks([
        {
          id: 'demo-mine-1',
          creator_profile_id: 'demo-user',
          title: 'My Demo Task',
          description: 'This is a demo task created by you.',
          skills_required: 'React, Node.js',
          status: 'open',
          created_at: new Date().toISOString(),
        },
      ]);
      setApplications({ 'demo-mine-1': 2 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks?mine=true');
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

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();

      if (response.ok && data.applications) {
        const counts: Record<string, number> = {};
        data.applications.forEach((app: { task_id: string }) => {
          counts[app.task_id] = (counts[app.task_id] || 0) + 1;
        });
        setApplications(counts);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Tasks</h1>
          <p className="text-white/80">Manage tasks you've created</p>
        </div>
        <Link
          href="/tasks/new"
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 hover:scale-105 font-semibold shadow-lg shadow-green-900/30"
        >
          Create New Task
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-md">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 text-center border border-purple-400/30">
          <p className="text-white/80 mb-4 text-lg">You haven't created any tasks yet.</p>
          <Link
            href="/tasks/new"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 font-semibold group"
          >
            Create your first task <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.01] opacity-0 animate-fade-in-up-delayed"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{task.title}</h3>
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
                  {applications[task.id] > 0 && (
                    <p className="text-sm text-blue-300 font-semibold">
                      {applications[task.id]} application{applications[task.id] !== 1 ? 's' : ''} received
                    </p>
                  )}
                </div>
              </div>

              {task.description && (
                <p className="text-white/70 text-sm mb-4 leading-relaxed">{task.description}</p>
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

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-400/20">
                <div className="text-xs text-white/50">
                  Created {new Date(task.created_at).toLocaleDateString()}
                </div>
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-purple-300 hover:text-purple-200 text-sm font-semibold group inline-flex items-center gap-1"
                >
                  View Details <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

