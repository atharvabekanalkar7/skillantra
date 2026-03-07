import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { parseSkills } from '@/lib/utils';
import Link from 'next/link';
import SendDMButton from '@/components/SendDMButton';
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
}: {
  params: Promise<{ id: string }> | { id: string };
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

  // Hide phone_number from non-owners
  if (!isOwnProfile) {
    profile.phone_number = null;
  }

  return (
    <div className="max-w-3xl mx-auto opacity-0 animate-fade-in-up">
      <AppCard className="p-6 sm:p-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-200 text-sm font-medium mb-4 inline-flex items-center gap-1 min-h-[44px] py-2 touch-manipulation transition-colors"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-2">{profile.name}</h1>
          {profile.college && (
            <p className="text-slate-400 text-sm mb-2">{profile.college}</p>
          )}
          {profileEmail && (
            <p className="text-slate-400 text-sm mb-3">
              ✉️ {profileEmail}
            </p>
          )}
          {profile.bio && profile.user_type !== 'recruiter' && (
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
              {profile.company_description && (
                <div className="mt-4">
                  <span className="text-slate-500 font-medium text-sm block mb-1">About Company</span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{profile.company_description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {profile.user_type && profile.user_type !== 'recruiter' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">I am a:</h2>
            <span className="inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-700">
              {profile.user_type}
            </span>
          </div>
        )}

        {skills.length > 0 && (
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

          {!isOwnProfile && currentUserProfile && (
            <div className="bg-slate-800/50 border border-slate-700 text-slate-200 px-5 py-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Collaborate with {profile.name}</h3>
                <p className="text-sm text-slate-400">Direct messages have arrived!</p>
              </div>
              <SendDMButton receiverId={profile.id} receiverName={profile.name} />
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

