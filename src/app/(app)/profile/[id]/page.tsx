import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { parseSkills } from '@/lib/utils';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import ConnectionButton from '@/components/ConnectionButton';
import { AppCard } from '@/components/ui/app-card';

async function getProfile(profileId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
}

async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }

  return data;
}

async function getProfileEmail(profileId: string) {
  const supabase = await createClient();

  // Get the profile to find user_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single();

  if (!profile) {
    return null;
  }

  // Get current user to check if this is their profile
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser || currentUser.id !== profile.user_id) {
    // Not the owner, don't return email
    return null;
  }

  // Return the email for the profile owner
  return currentUser.email;
}


export default async function ProfileViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ from?: string; internshipId?: string }> | { from?: string; internshipId?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Handle params - can be a Promise in Next.js 15+ or object in earlier versions
  const resolvedParams = params instanceof Promise ? await params : params;
  const profileId = resolvedParams.id;

  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const fromInternship = resolvedSearchParams.from === 'internship';
  const internshipId = resolvedSearchParams.internshipId;

  if (!profileId) {
    return (
      <div className="max-w-2xl mx-auto opacity-0 animate-fade-in-up">
        <AppCard className="text-center">
          <p className="text-slate-400 mb-4">Profile ID is required</p>
          <Link
            href="/dashboard"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Return to dashboard
          </Link>
        </AppCard>
      </div>
    );
  }

  const profile = await getProfile(profileId);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto opacity-0 animate-fade-in-up">
        <AppCard className="text-center">
          <p className="text-slate-400 mb-4">Profile not found</p>
          <Link
            href="/dashboard"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Return to dashboard
          </Link>
        </AppCard>
      </div>
    );
  }

  const currentUserProfile = await getCurrentUserProfile();
  const isOwnProfile = currentUserProfile?.id === profile.id;

  const skills = parseSkills(profile.skills);

  // Get email for own profile only
  const profileEmail = isOwnProfile ? await getProfileEmail(profileId) : null;

  // Fetch whether the viewed profile has a resume
  const { data: hasResume } = await supabase
    .from('skillantra_resumes')
    .select('id')
    .eq('student_id', profile.id)
    .maybeSingle();

  // Hide phone_number from non-owners
  if (!isOwnProfile) {
    profile.phone_number = null;
  }

  return (
    <div className="max-w-3xl mx-auto opacity-0 animate-fade-in-up">
      <AppCard className="p-6 sm:p-8">
        <div className="mb-6">
          {fromInternship && internshipId ? (
            <Link
              href={`/internships/${internshipId}/applicants`}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold mb-4 inline-flex items-center gap-1 min-h-[44px] py-2 touch-manipulation transition-colors"
            >
              ← Back to Internship Listing
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-200 text-sm font-medium mb-4 inline-flex items-center gap-1 min-h-[44px] py-2 touch-manipulation transition-colors"
            >
              ← Back to dashboard
            </Link>
          )}
          {profile.user_type === 'recruiter' && profile.company_logo_url && (
            <img src={profile.company_logo_url} alt="Company Logo" className="w-16 h-16 rounded-xl object-cover mb-4 border border-slate-700 bg-slate-800" />
          )}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">{profile.name}</h1>
            {profile.is_verified_recruiter && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-1 sm:mt-0 shadow-sm shadow-blue-500/5">
                <BadgeCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold tracking-wide uppercase">Verified Recruiter</span>
              </div>
            )}
          </div>
          {profile.college && (
            <p className="text-slate-400 text-sm mb-2">{profile.college}</p>
          )}
          {profileEmail && (
            <p className="text-slate-400 text-sm mb-3">
              ✉️ {profileEmail}
            </p>
          )}
          {profile.bio && profile.user_type === 'student' && (
            <p className="text-slate-300 text-base sm:text-lg mb-4 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
          )}

          {profile.user_type === 'recruiter' && (
            <div className="mt-4 mb-4">
              {profile.company_name && (
                <div className="mb-2">
                  <span className="text-slate-500 font-medium text-sm block">Company</span>
                  <p className="text-slate-200">{profile.company_name}</p>
                </div>
              )}
              {profile.designation && (
                <div className="mb-2 mt-4">
                  <span className="text-slate-500 font-medium text-sm block">Designation</span>
                  <p className="text-slate-200">{profile.designation}</p>
                </div>
              )}
              {profile.company_description && (
                <div className="mt-4">
                  <span className="text-slate-500 font-medium text-sm block mb-1">About Company</span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{profile.company_description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {profile.user_type === 'student' && profile.degree_level && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Degree</h2>
            <span className="inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-700">
              {profile.degree_level}
            </span>
          </div>
        )}

        {profile.user_type === 'student' && skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-800">
          <div className="text-sm text-slate-500 mb-4">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>

          {profile.user_type === 'student' && hasResume && profile.is_resume_public && (
            <div className="mb-6">
              <a
                href={`/resume/${profile.id}`}
                target="_blank"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                  color: '#c7d2fe',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                View SkillAntra Resume
              </a>
            </div>
          )}

          {!isOwnProfile && currentUserProfile && (
            <div className="bg-slate-800/50 border border-slate-700 text-slate-200 px-5 py-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Collaborate with {profile.name}</h3>
                <p className="text-sm text-slate-400">Expand your network.</p>
              </div>
              <ConnectionButton profileId={profile.id} />
            </div>
          )}

          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-medium touch-manipulation"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </AppCard>
    </div>
  );
}

