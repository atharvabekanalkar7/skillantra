'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/types';
import { parseSkills } from '@/lib/utils';

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const skills = parseSkills(profile.skills);

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{profile.name}</h3>
      
      {profile.college && (
        <p className="text-gray-500 text-sm mb-2">{profile.college}</p>
      )}
      
      {profile.bio && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{profile.bio}</p>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="inline-block text-gray-500 text-xs px-2 py-1">
              +{skills.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </div>
    </Link>
  );
}

