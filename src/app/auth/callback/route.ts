import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  // Default to login page after email confirmation
  const next = requestUrl.searchParams.get('next') ?? '/login?confirmed=true';

  const supabase = await createClient();

  // Handle PKCE flow (code parameter)
  if (code) {
    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Code exchange error:', error);
        redirect('/login?error=email_confirmation_failed');
        return;
      }

      if (data.user) {
        // Email confirmed successfully - create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!existingProfile && data.user.user_metadata) {
          // Create profile from metadata
          const { full_name, college } = data.user.user_metadata;
          if (full_name) {
            try {
              await supabase.from('profiles').insert({
                user_id: data.user.id,
                name: full_name,
                college: college || null,
              });
            } catch (profileError) {
              // Profile might already exist - that's okay
              console.log('Profile creation note:', profileError);
            }
          }
        }

        // If user has a session, redirect to dashboard
        if (data.session) {
          redirect('/dashboard');
          return;
        }
      }

      // Redirect to login page (or the specified next URL)
      redirect(next);
      return;
    } catch (error: any) {
      console.error('Callback error:', error);
      redirect('/login?error=email_confirmation_failed');
      return;
    }
  }

  // Handle OTP flow (token_hash and type parameters)
  if (token_hash && type) {
    // Verify the email confirmation token
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Email confirmed successfully - create profile if it doesn't exist
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingProfile && user.user_metadata) {
          // Create profile from metadata
          const { full_name, college } = user.user_metadata;
          if (full_name) {
            try {
              await supabase.from('profiles').insert({
                user_id: user.id,
                name: full_name,
                college: college || null,
              });
            } catch (profileError) {
              // Profile might already exist - that's okay
              console.log('Profile creation note:', profileError);
            }
          }
        }

        // If user is confirmed and has a session, redirect to dashboard
        // Otherwise redirect to login page
        if (user.email_confirmed_at) {
          // Check if we have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // User is logged in, redirect to dashboard
            redirect('/dashboard');
            return;
          }
        }
      }

      // Redirect to login page (or the specified next URL)
      redirect(next);
      return;
    } else {
      // Error verifying token
      console.error('Email confirmation error:', error);
      redirect('/login?error=email_confirmation_failed');
      return;
    }
  }

  // No valid parameters provided - might be a direct visit or invalid link
  redirect('/login?error=invalid_confirmation_link');
}

