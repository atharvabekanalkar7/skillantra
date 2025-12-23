/**
 * Profile utility functions
 */

import { createClient } from './supabase/server';
import type { Profile } from './types';

/**
 * Check if a profile is complete (has all required fields)
 * Required fields: name, phone_number, user_type
 */
export function isProfileComplete(profile: Profile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  // Check required fields
  const hasName = Boolean(profile.name && profile.name.trim().length > 0);
  const hasPhone = Boolean(profile.phone_number && profile.phone_number.trim().length > 0);
  const hasUserType = Boolean(profile.user_type && ['SkillSeeker', 'SkillHolder', 'Both'].includes(profile.user_type));

  return hasName && hasPhone && hasUserType;
}

/**
 * Get profile completeness status for API routes
 * Returns null if profile is complete, error response if incomplete
 */
export async function requireCompleteProfile(userId: string): Promise<{ complete: boolean; profile?: Profile | null }> {
  try {
    const supabase = await createClient();
    
    // Try to get profile with phone_number
    let profile: Profile | null = null;
    const { data: profileWithPhone, error: errorWithPhone } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (errorWithPhone && errorWithPhone.message?.includes('phone_number')) {
      // phone_number column doesn't exist - select without it
      const { data: profileWithoutPhone, error: errorWithoutPhone } = await supabase
        .from('profiles')
        .select('id, user_id, name, bio, skills, college, user_type, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      profile = profileWithoutPhone as Profile | null;
      if (profile) {
        (profile as any).phone_number = null;
      }
    } else {
      profile = profileWithPhone as Profile | null;
    }

    const complete = isProfileComplete(profile);
    return { complete, profile };
  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return { complete: false, profile: null };
  }
}

