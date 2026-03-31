'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import PhoneNumberModal from '@/components/PhoneNumberModal';
import { formatTimeAgo } from '@/lib/utils/timeAgo';
import { useCountdown } from '@/lib/utils/useCountdown';
import type { Task } from '@/lib/types';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';

// Small component for deadline countdown on each card
function DeadlineCountdown({ deadline }: { deadline: string }) {
  const countdown = useCountdown(deadline);
  if (!countdown) return null;
  return (
    <span className={`text-xs font-semibold ${countdown.expired ? 'text-red-400' : 'text-amber-300'}`}>
      ⏰ {countdown.text}
    </span>
  );
}

const MODE_LABELS: Record<string, string> = {
  remote: '🏠 Remote',
  hybrid: '🔄 Hybrid',
  'in-person': '🏢 In-person',
};

const TASK_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  project: { label: 'Project', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  research: { label: 'Research', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  competition: { label: 'Competition', color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function BrowseTasksPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'project' | 'research' | 'competition'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTaskId, setApplyingTaskId] = useState<string | null>(null);
  const [appliedTaskIds, setAppliedTaskIds] = useState<Set<string>>(new Set());
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    if (!isDemo) {
      loadAppliedTasks();
      loadUserProfile();
    }
  }, [isDemo]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(t => t.task_type === activeFilter));
    }
  }, [activeFilter, tasks]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserType(data.profile?.user_type || null);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const loadTasks = async () => {
    if (isDemo) {
      const demoData: Task[] = [
        {
          id: 'demo-p1',
          creator_profile_id: 'demo-c1',
          title: 'Build a Full Stack Portfolio Platform',
          description: 'Looking for a React + Node.js developer to help build a modern portfolio platform with customization features for students.',
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
        {
          id: 'demo-p2',
          creator_profile_id: 'demo-c2',
          title: 'Develop AI Chatbot for Campus Queries',
          description: 'Need ML + backend support to build a RAG-based chatbot that can answer IIT Mandi campus-related administrative queries.',
          skills_required: 'Python, OpenAI API, Flask, Vector DB',
          task_type: 'project',
          payment_type: 'other',
          stipend_min: null,
          stipend_max: null,
          payment_other_details: 'Certificate + Future Funding Share',
          application_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          mode_of_work: 'hybrid',
          attachments: [],
          status: 'open',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-r1',
          creator_profile_id: 'demo-c3',
          title: 'NLP-based Resume Screening Study',
          description: 'Looking for an research assistant interested in NLP and ML research. We are analyzing biases in automated recruitment systems.',
          skills_required: 'NLP, Python, Data Science, Research Methodology',
          task_type: 'research',
          payment_type: 'other',
          stipend_min: null,
          stipend_max: null,
          payment_other_details: 'Authorship Credit + LOR',
          application_deadline: null,
          mode_of_work: 'remote',
          attachments: [],
          status: 'open',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-r2',
          creator_profile_id: 'demo-c4',
          title: 'Energy Optimization in Smart Grids',
          description: 'Collaboration for an ongoing research project on smart grid stability using reinforcement learning. Needs electrical + data analysis expertise.',
          skills_required: 'MATLAB, Python, RL, Power Systems',
          task_type: 'research',
          payment_type: 'stipend',
          stipend_min: 3000,
          stipend_max: 5000,
          payment_other_details: null,
          application_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          mode_of_work: 'in-person',
          attachments: [],
          status: 'open',
          created_at: new Date(Date.now() - 1* 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-com1',
          creator_profile_id: 'demo-c5',
          title: 'Smart India Hackathon Team Formation',
          description: 'Forming a team for SIH 2026. Explicitly need a creative frontend developer and an ML enthusiast to tackle the disaster management track.',
          skills_required: 'Next.js, Tailwind, ML, Team Work',
          task_type: 'competition',
          payment_type: 'other',
          stipend_min: null,
          stipend_max: null,
          payment_other_details: 'Prize Share + Learning',
          application_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          mode_of_work: 'hybrid',
          attachments: [],
          status: 'open',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-com2',
          creator_profile_id: 'demo-c6',
          title: 'Inter IIT Tech Meet Prep Team',
          description: 'Forming a prep team for competitive programming and systems tracks of the Inter IIT Tech Meet. Looking for DSA + System Design wizards.',
          skills_required: 'C++, DSA, System Design, OS',
          task_type: 'competition',
          payment_type: 'other',
          stipend_min: null,
          stipend_max: null,
          payment_other_details: 'Representation + Networking',
          application_deadline: null,
          mode_of_work: 'in-person',
          attachments: [],
          status: 'open',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
      setTasks(demoData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
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
        headers: { 'Content-Type': 'application/json' },
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
      setAppliedTaskIds(prev => new Set([...prev, taskId]));
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

  // Check if deadline has passed (for disabling Apply button)
  const isDeadlinePassed = (task: Task): boolean => {
    if (!task.application_deadline) return false;
    return new Date(task.application_deadline).getTime() <= Date.now();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-8">
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-1 sm:mb-2 italic">
            Explore Projects & Collaborations
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Find real campus opportunities that match your skills</p>
        </div>
        <Link
          href="/tasks/new"
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] md:hover:scale-[1.02] font-medium touch-manipulation"
        >
          Create Task
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'project', 'research', 'competition'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 border ${
              activeFilter === type 
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-900 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <AppCard className="text-center p-8 md:p-10">
          <p className="text-slate-400 mb-4 text-lg">No matching projects or collaborations found.</p>
          <button onClick={() => setActiveFilter('all')} className="text-indigo-400 hover:text-indigo-300 font-medium">Show all tasks</button>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task, index) => {
            const deadlinePassed = isDeadlinePassed(task);
            const typeConfig = task.task_type ? TASK_TYPE_CONFIG[task.task_type] : null;

            return (
              <AppCard
                key={task.id}
                className="flex flex-col opacity-0 animate-fade-in-up-delayed relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-slate-100 pr-2 leading-tight">{task.title}</h3>
                    {typeConfig && (
                      <div className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-tighter ${typeConfig.color} ${typeConfig.bg} px-2 py-0.5 rounded-full border border-white/5 w-fit`}>
                        {typeConfig.label}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                </div>

                {task.description && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">{task.description}</p>
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
                            className="inline-block bg-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded-lg border border-slate-700 font-medium"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {/* Mode of Work */}
                  {task.mode_of_work && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300 font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                        {MODE_LABELS[task.mode_of_work] || task.mode_of_work}
                      </span>
                    </div>
                  )}

                  {/* Payment Info */}
                  {task.payment_type === 'stipend' && task.stipend_min !== null && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Stipend</p>
                      <p className="text-emerald-400 font-bold text-sm">
                        ₹{task.stipend_min.toLocaleString()} {task.stipend_max ? `– ₹${task.stipend_max.toLocaleString()}` : ''}
                      </p>
                    </div>
                  )}
                  {task.payment_type === 'other' && task.payment_other_details && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Benefit</p>
                      <p className="text-emerald-400 font-bold text-xs truncate">{task.payment_other_details}</p>
                    </div>
                  )}
                </div>

                {/* Deadline Countdown */}
                {task.application_deadline && (
                  <div className="mb-3 bg-white/5 rounded-lg p-2 border border-white/5">
                    <DeadlineCountdown deadline={task.application_deadline} />
                  </div>
                )}

                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>{formatTimeAgo(task.created_at)}</span>
                    {task.creator_profile?.name && (
                       <span>Posted by {task.creator_profile.name}</span>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800">
                    {currentUserType === 'recruiter' ? (
                      <button
                        disabled
                        className="w-full min-h-[44px] bg-slate-800 text-slate-400 py-2 px-4 rounded-xl cursor-not-allowed transition-all duration-200 font-medium text-sm touch-manipulation"
                      >
                        View Only
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApply(task.id)}
                        disabled={
                          applyingTaskId === task.id ||
                          task.status !== 'open' ||
                          appliedTaskIds.has(task.id) ||
                          deadlinePassed
                        }
                        className="w-full min-h-[44px] bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] font-medium text-sm touch-manipulation"
                      >
                        {isDemo
                          ? 'Sign Up to Apply'
                          : deadlinePassed
                            ? 'Applications Closed'
                            : appliedTaskIds.has(task.id)
                              ? 'Already Applied'
                              : applyingTaskId === task.id
                                ? 'Applying...'
                                : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              </AppCard>
            );
          })}
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
          if (pendingTaskId) {
            await applyToTask(pendingTaskId);
            setPendingTaskId(null);
          }
        }}
      />
    </div>
  );
}
