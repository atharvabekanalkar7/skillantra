'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setMessage({ type: 'success', text: 'Check your email for a reset link' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-start justify-center px-4 py-8 sm:py-12 w-full">
            <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute -bottom-40 right-1/5 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <div className="mb-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-3 min-h-[44px] rounded-lg transition-all mb-6 touch-manipulation"
                    >
                        <span>←</span>
                        <span className="text-sm font-medium">Back to Login</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                        Reset Password
                    </h1>
                    <p className="text-white/60 mt-2">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-auto shadow-[0_18px_45px_rgba(15,23,42,0.7)] backdrop-blur-sm">
                    {message && (
                        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === 'success'
                                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                : 'bg-red-500/20 border border-red-500/50 text-red-300'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                Email <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold shadow-[0_4px_14px_rgba(79,70,229,0.2)] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
