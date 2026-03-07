'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, FileText, Send, Search, Plus, ArrowRight, Briefcase, Users } from 'lucide-react';

interface DashboardStats {
  tasksCreated: number;
  applicationsSent: number;
  applicationsReceived: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = searchParams?.get('demo') === 'true';
  const [stats, setStats] = useState<DashboardStats>({
    tasksCreated: 0,
    applicationsSent: 0,
    applicationsReceived: 0,
  });
  const [recruiterStats, setRecruiterStats] = useState({
    internshipsPosted: 0,
    totalApplicants: 0,
    activeListings: 0,
  });
  const [userType, setUserType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDemo) {
      checkProfile();
    } else {
      loadStats();
    }
  }, [isDemo]);

  const checkProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!data.profile) {
        router.push('/profile/edit?setup=true');
        return;
      }
      setUserType(data.profile.user_type);
      loadStats(data.profile.user_type);
    } catch (error) {
      console.error('Error checking profile:', error);
      loadStats();
    }
  };

  const loadStats = async (currentUserType?: string) => {
    if (isDemo) {
      setStats({
        tasksCreated: 2,
        applicationsSent: 3,
        applicationsReceived: 5,
      });
      setLoading(false);
      return;
    }

    try {
      if (currentUserType === 'recruiter') {
        const internshipsResponse = await fetch('/api/internships?mine=true');
        const internshipsData = await internshipsResponse.json();
        const internships = internshipsData.internships || [];
        const internshipsPosted = internships.length;
        const totalApplicants = internships.reduce((sum: number, int: any) => sum + (int.applicant_count || 0), 0);
        const activeListings = internships.filter((int: any) => int.status === 'open').length;

        setRecruiterStats({
          internshipsPosted,
          totalApplicants,
          activeListings,
        });
      } else {
        const tasksResponse = await fetch('/api/tasks?mine=true');
        const tasksData = await tasksResponse.json();
        const tasksCreated = tasksData.tasks?.length || 0;

        const applicationsResponse = await fetch('/api/applications?sent=true');
        const applicationsData = await applicationsResponse.json();
        const applicationsSent = applicationsData.applications?.length || 0;

        const receivedApplicationsResponse = await fetch('/api/applications?received=true');
        const receivedApplicationsData = await receivedApplicationsResponse.json();
        const applicationsReceived = receivedApplicationsData.applications?.length || 0;

        setStats({
          tasksCreated,
          applicationsSent,
          applicationsReceived,
        });
      }
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="opacity-0 animate-fade-in-up max-w-5xl mx-auto py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-100 mb-2">
          Dashboard
        </h1>
        <p className="text-slate-400">Overview of your activity on SkillAntra</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {userType === 'recruiter' ? (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-indigo-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Internships Posted</h3>
              </div>
              <p className="text-4xl font-bold text-slate-100 mb-3">{recruiterStats.internshipsPosted}</p>
              <Link
                href={isDemo ? '/internships/mine?demo=true' : '/internships/mine'}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View My Internships <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Total Applicants</h3>
              </div>
              <p className="text-4xl font-bold text-slate-100 mb-3">{recruiterStats.totalApplicants}</p>
              <Link
                href={isDemo ? '/internships/mine?demo=true' : '/internships/mine'}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View Applications <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-indigo-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Active Listings</h3>
              </div>
              <p className="text-4xl font-bold text-slate-100 mb-3">{recruiterStats.activeListings}</p>
              <Link
                href={isDemo ? '/internships/mine?demo=true' : '/internships/mine'}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Manage Listings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-indigo-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Tasks Created</h3>
              </div>
              <p className="text-4xl font-bold text-slate-100 mb-3">{stats.tasksCreated}</p>
              <Link
                href={isDemo ? '/tasks/mine?demo=true' : '/tasks/mine'}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View My Tasks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-indigo-400">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Applications Sent</h3>
              </div>
              <p className="text-4xl font-bold text-slate-100 mb-3">{stats.applicationsSent}</p>
              <Link
                href={isDemo ? '/applications?demo=true' : '/applications'}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View Applications <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-medium text-slate-400">Applications Received</h3>
              </div>
              <p className="text-4xl font-bold text-slate-100 mb-3">{stats.applicationsReceived}</p>
              <Link
                href={isDemo ? '/tasks/mine?demo=true' : '/tasks/mine'}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View My Tasks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {userType === 'recruiter' ? (
              <>
                <Link
                  href={isDemo ? '/internships/new?demo=true' : '/internships/new'}
                  className="flex items-center gap-3 w-full min-h-[44px] bg-indigo-600 text-white py-3 px-5 rounded-lg hover:bg-indigo-500 font-medium transition-colors touch-manipulation"
                >
                  <Briefcase className="w-4 h-4" />
                  Post Internship
                </Link>
                <Link
                  href={isDemo ? '/internships/mine?demo=true' : '/internships/mine'}
                  className="flex items-center gap-3 w-full min-h-[44px] border border-slate-700 text-slate-300 py-3 px-5 rounded-lg hover:bg-slate-800 font-medium transition-colors touch-manipulation"
                >
                  <Users className="w-4 h-4" />
                  View Applications
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={isDemo ? '/tasks?demo=true' : '/tasks'}
                  className="flex items-center gap-3 w-full min-h-[44px] bg-indigo-600 text-white py-3 px-5 rounded-lg hover:bg-indigo-500 font-medium transition-colors touch-manipulation"
                >
                  <Search className="w-4 h-4" />
                  Browse Tasks
                </Link>
                <Link
                  href={isDemo ? '/internships?demo=true' : '/internships'}
                  className="flex items-center gap-3 w-full min-h-[44px] bg-indigo-600 text-white py-3 px-5 rounded-lg hover:bg-indigo-500 font-medium transition-colors touch-manipulation"
                >
                  <Briefcase className="w-4 h-4" />
                  Browse Internships
                </Link>
                <Link
                  href={isDemo ? '/collaborate?demo=true' : '/collaborate'}
                  className="flex items-center gap-3 w-full min-h-[44px] bg-indigo-600 text-white py-3 px-5 rounded-lg hover:bg-indigo-500 font-medium transition-colors touch-manipulation"
                >
                  <Users className="w-4 h-4" />
                  Find Team
                </Link>
                <Link
                  href={isDemo ? '/tasks/new?demo=true' : '/tasks/new'}
                  className="flex items-center gap-3 w-full min-h-[44px] border border-slate-700 text-slate-300 py-3 px-5 rounded-lg hover:bg-slate-800 font-medium transition-colors touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  Create New Task
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h2>
          <p className="text-slate-400 text-sm mb-5 leading-relaxed">
            View your tasks and applications to see your recent activity on SkillAntra.
          </p>
          <div className="space-y-2">
            {userType === 'recruiter' ? (
              <Link
                href={isDemo ? '/internships/mine?demo=true' : '/internships/mine'}
                className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm font-medium group py-1"
              >
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" /> My Internships
              </Link>
            ) : (
              <>
                <Link
                  href={isDemo ? '/tasks/mine?demo=true' : '/tasks/mine'}
                  className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm font-medium group py-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" /> My Tasks
                </Link>
                <Link
                  href={isDemo ? '/applications?demo=true' : '/applications'}
                  className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm font-medium group py-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" /> My Applications
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
