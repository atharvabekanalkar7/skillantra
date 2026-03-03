'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from '@/components/ProfileForm';
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

export default function EditProfilePage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const isSetup = searchParams?.get('setup') === 'true';
  const phoneRequired = searchParams?.get('phone_required') === 'true';
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) {
      // Demo mode: use mock profile
      setProfile({
        id: 'demo-profile',
        name: 'Demo User',
        bio: 'This is a demo profile',
        skills: 'React, TypeScript, Node.js',
        user_type: 'Both',
      });
      setLoading(false);
      return;
    }

    // Load real profile
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isDemo]);

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

  if (isDemo) {
    return (
      <div className="opacity-0 animate-fade-in-up h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 mb-6">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>

            <h2 className="text-xl font-semibold text-slate-200">
              Sign In Required
            </h2>

            <p className="mt-3 text-sm text-slate-500 max-w-md">
              Please sign in to access this feature.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all mb-6"
        >
          <span>←</span>
          <span className="text-sm font-medium">Back</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-3">
          {phoneRequired ? 'Phone Number Required' : profile ? 'Edit Profile' : isSetup ? 'Complete Your Profile' : 'Create Profile'}
        </h1>
        <p className="text-white/70">
          {phoneRequired
            ? 'Phone number is now required to use SkillAntra. Please add your phone number below.'
            : profile
              ? 'Update your profile information'
              : isSetup
                ? 'Welcome to SkillAntra! Please complete your profile to get started.'
                : 'Create your profile to get started'}
        </p>
        {phoneRequired && (
          <div className="mt-4 bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              <strong className="font-semibold">Why we need your phone number:</strong> Your phone number will be displayed to other users (both SkillSeekers and SkillHolders) on the platform to facilitate communication and collaboration. This helps build trust and enables direct contact between users.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <ProfileForm initialProfile={profile} />
      </div>
    </div>
  );
}
