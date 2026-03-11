import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

function LoginForm() {
  return <AuthForm mode="login" />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060910] flex flex-col items-center justify-start py-10 px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-white">Loading...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

