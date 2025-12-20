'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { parseSkills, formatSkills } from '@/lib/utils';

interface ProfileFormProps {
  initialProfile?: Profile | null;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [userType, setUserType] = useState<'SkillSeeker' | 'SkillHolder' | 'Both'>('Both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setBio(initialProfile.bio || '');
      setSkills(initialProfile.skills || '');
      setUserType(initialProfile.user_type || 'Both');
    }
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          user_type: userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save profile');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
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
    </form>
  );
}

