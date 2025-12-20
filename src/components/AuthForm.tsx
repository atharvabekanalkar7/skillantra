'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      if (!agreeToTerms) {
        setError('Please agree to the Terms of Service and Privacy Policy');
        setLoading(false);
        return;
      }

      if (!fullName || fullName.trim().length === 0) {
        setError('Full name is required');
        setLoading(false);
        return;
      }

      if (!college || college.trim().length === 0) {
        setError('Please select a college');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'signup') {
        // Store name and college in user metadata for profile creation after email confirmation
        const emailRedirectUrl = `${window.location.origin}/auth/callback`;
        
        console.log('Signing up with:', { email, emailRedirectUrl });
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: emailRedirectUrl,
            data: {
              full_name: fullName.trim(),
              college: college.trim(),
            },
          },
        });

        console.log('Signup response:', { 
          user: signUpData?.user ? 'exists' : 'null',
          session: signUpData?.session ? 'exists' : 'null',
          error: signUpError?.message 
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        // Check if email confirmation is required
        // If user exists but no session, email confirmation is required
        if (signUpData.user && !signUpData.session) {
          console.log('Email confirmation required - user created but no session');
          // Email confirmation required - show message to user
          setEmailSent(true);
          setLoading(false);
          return;
        }

        // If no user was returned, something went wrong
        if (!signUpData.user) {
          console.error('No user returned from signup');
          setError('Failed to create account. Please try again or check if email confirmations are enabled in Supabase.');
          setLoading(false);
          return;
        }

        // If email confirmation is disabled and user is immediately authenticated
        if (signUpData.user && signUpData.session) {
          // Create profile immediately
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: signUpData.user.id,
              name: fullName.trim(),
              college: college.trim(),
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't block signup - profile will be created on first login
          }

          router.push('/dashboard');
          router.refresh();
          return;
        }

        // Fallback: if we get here, something unexpected happened
        setError('An unexpected error occurred during signup');
        setLoading(false);
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        // After successful login, check if profile exists
        if (signInData.user) {
          try {
            const { data: existingProfile, error: checkError } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', signInData.user.id)
              .maybeSingle();

            // Only redirect if it's actually a table not found error (very specific check)
            const errorMessage = checkError?.message?.toLowerCase() || '';
            const isTableNotFound = checkError && (
              checkError.code === '42P01' ||
              checkError.code === 'PGRST116' ||
              (errorMessage.includes('relation') && errorMessage.includes('profiles') && errorMessage.includes('does not exist'))
            );

            if (isTableNotFound) {
              // Database tables not initialized - redirect to profile creation
              router.push('/profile/edit?setup=true');
              router.refresh();
              return;
            }

            // If no profile exists (and no error, or error is not table not found), redirect to profile creation
            if (!existingProfile) {
              // No profile exists - redirect to profile creation
              router.push('/profile/edit?setup=true');
              router.refresh();
              return;
            }

            // Profile exists or error is not critical - proceed to dashboard
          } catch (err) {
            // Silently handle errors - redirect to profile creation as fallback
            console.error('Error during profile check:', err);
            router.push('/profile/edit?setup=true');
            router.refresh();
            return;
          }
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Subtle background glows */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-lg relative z-10">
        {/* Back button and title */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all mb-6"
          >
            <span>←</span>
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-4xl font-bold text-white">
            {mode === 'signup' ? 'Create your SkillAntra account' : 'Log in to SkillAntra'}
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
          {emailSent ? (
            <div className="space-y-6 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-white/70 mb-4">
                  We've sent a confirmation email to <span className="font-semibold text-white">{email}</span>
                </p>
                <p className="text-white/60 text-sm mb-6">
                  Please click the confirmation link in the email to verify your account and complete your signup.
                </p>
                <div className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-lg text-sm mb-4">
                  <p className="font-medium mb-2">Didn't receive the email?</p>
                  <ul className="text-left list-disc list-inside space-y-1 text-xs mb-2">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes and try again</li>
                    <li>Verify email confirmations are enabled in Supabase dashboard</li>
                  </ul>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg text-sm mb-6">
                  <p className="font-medium mb-1">⚠️ Important:</p>
                  <p className="text-xs">
                    If you still don't receive emails, check your Supabase dashboard:
                    <br />
                    <strong>Authentication → Settings → Enable email confirmations</strong>
                    <br />
                    Also verify redirect URLs are configured correctly.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all transform hover:scale-[1.02]"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="college" className="block text-sm font-medium text-white mb-2">
                  College/University <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 z-10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <select
                    id="college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-900">Select your college</option>
                    <option value="Indian Institute of Technology (IIT) Mandi" className="bg-gray-900">Indian Institute of Technology (IIT) Mandi</option>
                    <option value="IIIT Una" disabled className="bg-gray-900 text-gray-500">IIIT Una (Coming Soon)</option>
                    <option value="NIT Hamirpur" disabled className="bg-gray-900 text-gray-500">NIT Hamirpur (Coming Soon)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                  placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="flex items-start gap-3">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 bg-gray-900/50 border-purple-500/50 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-white/90 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
              {!loading && mode === 'signup' && <span>→</span>}
            </button>
          </form>
          )}

          {!emailSent && (
            <div className="mt-6 text-center text-sm space-y-2">
              {mode === 'login' && (
                <p className="text-white/70 text-xs">
                  By logging in, you agree to our{' '}
                  <Link href="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Privacy Policy
                  </Link>
                </p>
              )}
              {mode === 'login' ? (
                <p className="text-white/70">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                    Sign up
                  </Link>
                </p>
              ) : (
                <p className="text-white/70">
                  Already have an account?{' '}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                    Log in
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
