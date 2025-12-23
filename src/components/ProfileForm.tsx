'use client';

import { useState, useEffect } from 'react';
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
  const [userType, setUserType] = useState<'SkillSeeker' | 'SkillHolder' | 'Both'>('Both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams?.get('setup') === 'true';

  const [email, setEmail] = useState<string | null>(null);

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
      setUserType(initialProfile.user_type || 'Both');
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
    setLoading(true);
    setError(null);

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
          user_type: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save profile');
        setLoading(false);
        return;
      }

      if (isSetup && !initialProfile) {
        // First time profile creation - show success message briefly
        router.push('/dashboard?profile_created=true');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
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
            className="w-full px-4 py-3 bg-gray-900/30 border border-purple-500/30 rounded-lg text-white/70 cursor-not-allowed"
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
            className="w-full px-4 py-3 bg-gray-900/30 border border-purple-500/30 rounded-lg text-white/70 cursor-not-allowed"
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
          className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="user_type" className="block text-sm font-medium text-white mb-2">
          I am a: <span className="text-red-400">*</span>
        </label>
        <select
          id="user_type"
          value={userType}
          onChange={(e) => setUserType(e.target.value as 'SkillSeeker' | 'SkillHolder' | 'Both')}
          required
          className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="">Select...</option>
          <option value="SkillSeeker" className="bg-gray-900">SkillSeeker</option>
          <option value="SkillHolder" className="bg-gray-900">SkillHolder</option>
          <option value="Both" className="bg-gray-900">Both</option>
        </select>
        <p className="mt-2 text-sm text-white/60">Choose how you want to use SkillAntra</p>
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
          className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
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
          className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
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
            className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
            placeholder="+91 1234567890"
            maxLength={20}
            inputMode="numeric"
          />
        </div>
        <p className="mt-2 text-sm text-white/60">
          Required for creating tasks and applying to tasks. Your phone number will only be displayed to users who have either accepted your task (if you are a SkillSeeker) or to users whose task you have applied to (if you are a SkillHolder).
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] font-semibold"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-4 border border-purple-500/50 rounded-lg text-white hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
        >
          Cancel
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

