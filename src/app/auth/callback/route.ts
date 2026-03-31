import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isValidIITMandiEmail } from '@/lib/auth-utils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  const supabase = await createClient();

  if (code) {
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      console.error('Auth callback error:', error);
      redirect('/login?error=auth_failed');
      return;
    }

    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Waitlist User';
    const googleId = user.id;

    // STEP 3 — ENFORCE IIT MANDI EMAIL RESTRICTION
    if (!isValidIITMandiEmail(email)) {
      await supabase.auth.signOut();
      redirect('/?error=only_iit_mandi_allowed');
      return;
    }

    // STEP 4 — CHECK WAITLIST ENTRY
    const { data: existingUser, error: checkError } = await supabase
      .from('waitlist_users')
      .select('status')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Waitlist check error:', checkError);
    }

    if (existingUser) {
      // If user is already approved, they might be logging in to the full platform
      if (existingUser.status === 'approved') {
        redirect('/dashboard');
        return;
      }
      
      // If they are waitlisted, let them go to the questions page (authenticated)
      redirect('/waitlist-questions');
      return;
    }

    // STEP 5 — INSERT INTO WAITLIST
    const { error: insertError } = await supabase
      .from('waitlist_users')
      .insert({
        email,
        name,
        google_id: googleId,
        college: 'IIT Mandi',
        status: 'waitlisted'
      });

    if (insertError) {
      console.error('Waitlist insert error:', insertError);
      redirect('/join-waitlist?error=waitlist_failed');
      return;
    }

    // Success — user is now on the waitlist
    // Redirect to questions page to gather more info
    // We keep the session for now so the questions page can get the user's email
    redirect('/waitlist-questions');
    return;
  }

  // Handle errors or missing code
  redirect('/login?error=invalid_request');
}
