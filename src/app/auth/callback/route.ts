import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  const supabase: Awaited<ReturnType<typeof createClient>> = await createClient();

  // ✅ PKCE flow (modern Supabase email confirmation)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback (code) error:', error);
      redirect('/login?error=email_confirmation_failed');
      return;
    }

    // Always redirect to login page after successful confirmation
    redirect('/login?confirmed=true');
    return;
  }

  // ⚠️ Legacy OTP flow (kept for backward compatibility)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email_change',
      token_hash,
    });

    if (error) {
      console.error('Auth callback (otp) error:', error);
      redirect('/login?error=email_confirmation_failed');
      return;
    }

    // Always redirect to login page after successful confirmation
    redirect('/login?confirmed=true');
    return;
  }

  // ❌ Invalid or malformed link
  redirect('/login?error=invalid_confirmation_link');
}
