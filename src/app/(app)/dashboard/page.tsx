'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  tasksCreated: number;
  applicationsSent: number;
  applicationsReceived: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [stats, setStats] = useState<DashboardStats>({
    tasksCreated: 0,
    applicationsSent: 0,
    applicationsReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [isDemo]);

  const loadStats = async () => {
    if (isDemo) {
      // Demo mode: use mock stats
      setStats({
        tasksCreated: 2,
        applicationsSent: 3,
        applicationsReceived: 5,
      });
      setLoading(false);
      return;
    }

    try {
      // Fetch my tasks
      const tasksResponse = await fetch('/api/tasks?mine=true');
      const tasksData = await tasksResponse.json();
      const tasksCreated = tasksData.tasks?.length || 0;

      // Fetch my applications
      const applicationsResponse = await fetch('/api/applications?mine=true');
      const applicationsData = await applicationsResponse.json();
      const applicationsSent = applicationsData.applications?.length || 0;

      // Fetch applications received on my tasks
      const receivedApplicationsResponse = await fetch('/api/applications');
      const receivedApplicationsData = await receivedApplicationsResponse.json();
      const applicationsReceived = receivedApplicationsData.applications?.length || 0;

      setStats({
        tasksCreated,
        applicationsSent,
        applicationsReceived,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500/30"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-400 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-10">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-xl text-white font-normal">Overview of your activity on SkillAntra</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="group bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-blue-400/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] opacity-0 animate-fade-in-up-delayed">
          <h3 className="text-lg font-bold text-blue-300 mb-3">Tasks Created</h3>
          <p className="text-5xl font-black text-blue-400 mb-4">{stats.tasksCreated}</p>
          <Link
            href="/tasks/mine"
            className="inline-flex items-center text-blue-200 hover:text-blue-100 text-sm font-semibold group-hover:gap-2 transition-all"
          >
            View My Tasks <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>

        <div className="group bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-green-400/40 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] opacity-0 animate-fade-in-up-delayed-2">
          <h3 className="text-lg font-bold text-green-300 mb-3">Applications Sent</h3>
          <p className="text-5xl font-black text-green-400 mb-4">{stats.applicationsSent}</p>
          <Link
            href="/applications"
            className="inline-flex items-center text-green-200 hover:text-green-100 text-sm font-semibold group-hover:gap-2 transition-all"
          >
            View My Applications <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>

        <div className="group bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-purple-400/40 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] opacity-0 animate-fade-in-up-delayed-3">
          <h3 className="text-lg font-bold text-purple-300 mb-3">Applications Received</h3>
          <p className="text-5xl font-black text-purple-400 mb-4">{stats.applicationsReceived}</p>
          <Link
            href="/tasks/mine"
            className="inline-flex items-center text-purple-200 hover:text-purple-100 text-sm font-semibold group-hover:gap-2 transition-all"
          >
            View My Tasks <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-cyan-400/40 transition-all duration-300 opacity-0 animate-fade-in-up-delayed-4">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              href="/tasks"
              className="block w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl hover:from-blue-500 hover:to-cyan-500 text-center font-bold text-lg transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-900/30"
            >
              Browse Tasks
            </Link>
            <Link
              href="/tasks/new"
              className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-500 hover:to-emerald-500 text-center font-bold text-lg transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-green-900/30"
            >
              Create New Task
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-purple-400/40 transition-all duration-300 opacity-0 animate-fade-in-up-delayed-4">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <p className="text-white/90 text-base mb-6 leading-relaxed">
            View your tasks and applications to see your recent activity on SkillAntra.
          </p>
          <div className="space-y-3">
            <Link
              href="/tasks/mine"
              className="flex items-center gap-3 text-purple-200 hover:text-purple-100 text-base font-semibold group"
            >
              <span className="group-hover:translate-x-2 transition-transform duration-200">→</span> My Tasks
            </Link>
            <Link
              href="/applications"
              className="flex items-center gap-3 text-purple-200 hover:text-purple-100 text-base font-semibold group"
            >
              <span className="group-hover:translate-x-2 transition-transform duration-200">→</span> My Applications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
