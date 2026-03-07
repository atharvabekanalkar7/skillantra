import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

function LoginForm() {
  return <AuthForm mode="login" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

