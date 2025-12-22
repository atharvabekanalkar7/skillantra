import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

function SignupForm() {
  return <AuthForm mode="signup" />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}

