import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AuthForm from '@/components/AuthForm';

async function SignupForm() {
  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return <AuthForm mode="signup" />;
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#060910] flex flex-col items-center justify-start py-10 px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-white">Loading...</div>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  );
}
