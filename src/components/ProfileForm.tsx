'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { parseSkills, formatSkills } from '@/lib/utils';
import DeleteAccountButton from './DeleteAccountButton';

interface ProfileFormProps {
  initialProfile?: Profile | null;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [degreeLevel, setDegreeLevel] = useState<'UG' | 'PG' | ''>('');
  const [rolePreference, setRolePreference] = useState<'SkillSeeker' | 'SkillHolder' | 'Both'>('Both');
  const [isCollaborationAvailable, setIsCollaborationAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams?.get('setup') === 'true';
  const mountedRef = useRef(true);

  const [email, setEmail] = useState<string | null>(null);

  // Track component mount state to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isPhoneMissing = !phoneNumber || phoneNumber.replace(/^\+91\s*/, '').trim() === '';
      if (!success && isPhoneMissing) {
        e.preventDefault();
        e.returnValue = 'Phone number is required to continue.';
        return 'Phone number is required to continue.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [success, phoneNumber]);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setBio(initialProfile.bio || '');
      setSkills(initialProfile.skills || '');
      // Format phone number with +91 prefix if it exists
      if (initialProfile.phone_number) {
        setPhoneNumber('+91 ' + initialProfile.phone_number);
      } else {
        setPhoneNumber('+91 ');
      }
      setRolePreference((initialProfile as any).role_preference || 'Both');
      setIsCollaborationAvailable((initialProfile as any).is_collaboration_available ?? true);
      setDegreeLevel((initialProfile as any).degree_level || '');
      setEmail((initialProfile as any).email || null);
    } else {
      // Load email from API if no initial profile
      const loadEmail = async () => {
        try {
          const response = await fetch('/api/profile');
          const data = await response.json();
          if (data.profile && (data.profile as any).email) {
            setEmail((data.profile as any).email);
          }
        } catch (err) {
          console.error('Error loading email:', err);
        }
      };
      loadEmail();
    }
  }, [initialProfile]);

  const validatePhone = (phone: string): boolean => {
    // Remove +91 prefix and spaces for validation
    const cleaned = phone.replace(/^\+91\s*/, '').trim();
    return /^[0-9]{10,15}$/.test(cleaned);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Ensure +91 prefix is always present
    if (!value.startsWith('+91')) {
      value = '+91 ' + value.replace(/^\+91\s*/, '');
    }

    // Only allow digits after +91
    const afterPrefix = value.substring(4);
    const digitsOnly = afterPrefix.replace(/\D/g, '');

    if (digitsOnly.length <= 15) {
      setPhoneNumber('+91 ' + digitsOnly);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-submit
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate phone number
    const cleaned = phoneNumber.replace(/^\+91\s*/, '').trim();
    if (!cleaned) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setError('Phone number must be 10-15 digits after +91');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || null,
          skills: skills.trim() || null,
          phone_number: cleaned,
          role_preference: rolePreference,
          degree_level: degreeLevel,
          is_collaboration_available: isCollaborationAvailable,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (mountedRef.current) {
          setError(data.error || 'Failed to save profile');
          setLoading(false);
        }
        return;
      }

      // SUCCESS: Show success state before navigating
      if (mountedRef.current) {
        setLoading(false);
        setSuccess(true);
      }

      // Brief delay to show success feedback, then navigate
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (isSetup && !initialProfile) {
        router.push('/dashboard?profile_created=true');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
        setSuccess(false);
      }
    }
  };

  // Derive button text and style from state
  const getButtonContent = () => {
    if (loading) {
      return (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving…
        </span>
      );
    }
    if (success) {
      return (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
          Profile Saved Successfully
        </span>
      );
    }
    return 'Save Profile';
  };

  const getButtonClasses = () => {
    const base = 'flex-1 min-h-[44px] text-white py-4 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed transition-all active:scale-[0.98] md:hover:scale-[1.02] font-semibold touch-manipulation';

    if (success) {
      return `${base} bg-emerald-600 focus:ring-emerald-500`;
    }
    return `${base} bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 disabled:opacity-50`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Profile saved successfully! Redirecting…
        </div>
      )}

      {initialProfile?.college && (
        <div>
          <label htmlFor="college" className="block text-sm font-medium text-white mb-2">
            College/University
          </label>
          <input
            id="college"
            type="text"
            value={initialProfile.college}
            disabled
            readOnly
            className="w-full px-4 py-3 bg-slate-900/30 border border-slate-800 rounded-lg text-white/70 cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-white/50">College cannot be changed after signup</p>
        </div>
      )}

      {email && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            readOnly
            className="w-full px-4 py-3 bg-slate-900/30 border border-slate-800 rounded-lg text-white/70 cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-white/50">Email cannot be changed</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading || success}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="role_preference" className="block text-sm font-medium text-white mb-2">
          I am a (Role Preference): <span className="text-red-400">*</span>
        </label>
        <select
          id="role_preference"
          value={rolePreference}
          onChange={(e) => setRolePreference(e.target.value as 'SkillSeeker' | 'SkillHolder' | 'Both')}
          required
          disabled={loading || success}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
        >
          <option value="">Select...</option>
          <option value="SkillSeeker" className="bg-slate-900">SkillSeeker</option>
          <option value="SkillHolder" className="bg-slate-900">SkillHolder</option>
          <option value="Both" className="bg-slate-900">Both</option>
        </select>
        <p className="mt-2 text-sm text-slate-400">Choose how you want to use SkillAntra</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Collaboration Availability
        </label>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isCollaborationAvailable}
              onChange={(e) => setIsCollaborationAvailable(e.target.checked)}
              disabled={loading || success}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
          </label>
          <span className="text-sm text-slate-300">Available for collaboration</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Degree Level <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
            <input
              type="radio"
              name="degreeLevel"
              value="UG"
              checked={degreeLevel === 'UG'}
              onChange={() => setDegreeLevel('UG')}
              disabled={loading || success}
              className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 bg-slate-900/50"
              required
            />
            UG (B.Tech / B.E. / B.S. / iMBA)
          </label>
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
            <input
              type="radio"
              name="degreeLevel"
              value="PG"
              checked={degreeLevel === 'PG'}
              onChange={() => setDegreeLevel('PG')}
              disabled={loading || success}
              className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-700 bg-slate-900/50"
              required
            />
            PG (M.Tech / M.Tech(R) / M.A. / M.Sc. / MBA)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          disabled={loading || success}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div>
        <label htmlFor="skills" className="block text-sm font-medium text-white mb-2">
          Skills
        </label>
        <input
          id="skills"
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          disabled={loading || success}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
          placeholder="React, TypeScript, Node.js (comma-separated)"
        />
        <p className="mt-2 text-sm text-white/60">Separate skills with commas</p>
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-white mb-2">
          Phone Number <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/70 z-10">
            <span className="text-lg">🇮🇳</span>
          </div>
          <input
            id="phone_number"
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneInputChange}
            required
            disabled={loading || success}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            placeholder="+91 1234567890"
            maxLength={20}
            inputMode="numeric"
          />
        </div>
        <p className="mt-2 text-sm text-white/60">
          Required for creating tasks and applying to tasks. Your phone number will only be displayed to users who have either accepted your task (if you are a SkillSeeker) or to users whose task you have applied to (if you are a SkillHolder).
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 min-h-[44px] px-6 py-4 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors font-semibold touch-manipulation disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || success}
          className={getButtonClasses()}
        >
          {getButtonContent()}
        </button>
      </div>

      {initialProfile && (
        <div className="mt-8 pt-8 border-t border-red-500/30">
          <h3 className="text-lg font-semibold text-white mb-2">Danger Zone</h3>
          <p className="text-sm text-white/60 mb-4">
            Once you delete your account, there is no going back. This will permanently delete your profile, tasks, applications, and all associated data.
          </p>
          <DeleteAccountButton />
        </div>
      )}
    </form>
  );
}
