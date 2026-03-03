import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

function LoginForm() {
  return <AuthForm mode="login" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

