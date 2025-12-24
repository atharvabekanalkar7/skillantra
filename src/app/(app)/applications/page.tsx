'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatTimeAgo } from '@/lib/utils/timeAgo';

interface Task {
  id: string;
  title: string;
  description: string | null;
  skills_required: string | null;
  status: 'open' | 'closed';
  created_at: string;
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
      // Demo mode: use mock data
      setApplications([
        {
          id: 'demo-app-1',
          task_id: 'demo-task-1',
          applicant_profile_id: 'demo-user',
          status: 'pending',
          created_at: new Date().toISOString(),
          task: {
            id: 'demo-task-1',
            title: 'Build a React Dashboard',
            description: 'Looking for a frontend developer to help build a modern dashboard.',
            skills_required: 'React, TypeScript',
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
        // Handle table not found gracefully
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border border-green-400/50';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border border-red-400/50';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Applications</h1>
        <p className="text-white/80">Track your task applications</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-md">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 text-center border border-purple-400/30">
          <p className="text-white/80 mb-4 text-lg">You haven't applied to any tasks yet.</p>
          <Link
            href="/tasks"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 font-semibold group"
          >
            Browse available tasks <span className="group-hover:translate-x-1 transition-transform duration-200 ml-1">→</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application, index) => (
            <div
              key={application.id}
              className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.01] opacity-0 animate-fade-in-up-delayed"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {application.task && (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-3">
                        {application.task.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            application.task.status === 'open'
                              ? 'bg-green-500/20 text-green-300 border border-green-400/50'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-400/50'
                          }`}
                        >
                          Task: {application.task.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {application.task.description && (
                    <p className="text-white/70 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {application.task.description}
                    </p>
                  )}

                  {application.task.skills_required && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wide">Skills Required:</p>
                      <div className="flex flex-wrap gap-2">
                        {application.task.skills_required
                          .split(',')
                          .slice(0, 5)
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

                  {application.task?.creator && (
                    <div className="mb-4 p-3 bg-purple-500/10 border border-purple-400/30 rounded-lg">
                      <p className="text-xs font-semibold text-purple-300 mb-1">Task Creator:</p>
                      <Link
                        href={`/profile/${application.task.creator.id}`}
                        className="text-sm text-purple-300 hover:text-purple-200 font-semibold hover:underline"
                      >
                        👤 View {application.task.creator.name}'s Profile
                      </Link>
                    </div>
                  )}
                  {application.status === 'accepted' && application.task?.creator?.phone_number && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                      <p className="text-xs font-semibold text-green-300 mb-1">Contact Information:</p>
                      <p className="text-sm text-white font-medium">
                        {application.task.creator.name}
                      </p>
                      <p className="text-sm text-green-300 font-semibold">
                        📞 +91 {application.task.creator.phone_number}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-400/20">
                    <div className="text-xs text-white/50">
                      Applied {formatTimeAgo(application.created_at)}
                    </div>
                    <Link
                      href={`/tasks/${application.task.id}`}
                      className="text-purple-300 hover:text-purple-200 text-sm font-semibold group inline-flex items-center gap-1"
                    >
                      View Task <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

