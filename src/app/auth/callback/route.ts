import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

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
            await supabase.from('profiles').insert({
              user_id: user.id,
              name: full_name,
              college: college || null,
            });
          }
        }
      }

      redirect(next);
    } else {
      // Error verifying token
      console.error('Email confirmation error:', error);
      redirect('/login?error=email_confirmation_failed');
    }
  } else {
    // No token provided - might be a direct visit or invalid link
    redirect('/login?error=invalid_confirmation_link');
  }
}

