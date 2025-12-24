import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SendRequestForm from '@/components/SendRequestForm';
import { parseSkills } from '@/lib/utils';
import Link from 'next/link';

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

async function hasPendingRequest(senderId: string, receiverId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('collaboration_requests')
    .select('id')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error('Error checking pending request:', error);
    return false;
  }

  return !!data;
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">Profile ID is required</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const profile = await getProfile(profileId);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">Profile not found</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentUserProfile = await getCurrentUserProfile();
  const isOwnProfile = currentUserProfile?.id === profile.id;
  const hasPending = currentUserProfile
    ? await hasPendingRequest(currentUserProfile.id, profile.id)
    : false;

  const skills = parseSkills(profile.skills);

  // Get email for own profile only
  const profileEmail = isOwnProfile ? await getProfileEmail(profileId) : null;

  // Hide phone_number from non-owners
  if (!isOwnProfile) {
    profile.phone_number = null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
          {profile.college && (
            <p className="text-gray-600 text-sm mb-2">{profile.college}</p>
          )}
          {profileEmail && (
            <p className="text-gray-600 text-sm mb-3">
              ✉️ {profileEmail}
            </p>
          )}
          {profile.bio && (
            <p className="text-gray-700 text-lg mb-4 whitespace-pre-wrap">{profile.bio}</p>
          )}
        </div>

        {profile.user_type && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">I am a:</h2>
            <span className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {profile.user_type}
            </span>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-4">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>

          {!isOwnProfile && currentUserProfile && (
            <div>
              {hasPending ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  You have a pending collaboration request with this user.
                </div>
              ) : (
                <SendRequestForm receiverId={profile.id} receiverName={profile.name} />
              )}
            </div>
          )}

          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

