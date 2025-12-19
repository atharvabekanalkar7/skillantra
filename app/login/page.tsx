"use client";

import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans">
      <div className="mx-auto max-w-md px-6 py-12">
        {/* Header with Back Button */}
        <header className="mb-12 flex items-center justify-end">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-700/50 hover:border-slate-600"
            title="Back to home"
          >
            <span className="text-lg">←</span>
            <span>Back</span>
          </Link>
        </header>

        {/* Login Card */}
        <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
          <div className="w-full">
            <h2 className="mb-8 text-center text-3xl font-semibold text-white">
              Login to SkillAntra
            </h2>

            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-8 shadow-2xl">
              <form className="flex flex-col gap-5">
                {/* Email Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">
                    College Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ✉️
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="h-12 w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-4 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="you@college.edu"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      🔒
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      className="h-12 w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-12 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl"
                >
                  Log in
                  <span>→</span>
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-700"></div>
                <span className="text-sm text-slate-400">or sign in with</span>
                <div className="h-px flex-1 bg-slate-700"></div>
              </div>

              {/* Social Sign In */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 font-medium text-white transition-all hover:bg-slate-700 hover:border-slate-500"
                >
                  <span className="text-lg">G</span>
                  Google
                </button>
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 font-medium text-white transition-all hover:bg-slate-700 hover:border-slate-500"
                >
                  <span className="text-lg">🐙</span>
                  GitHub
                </button>
              </div>

              {/* Sign Up Link */}
              <p className="mt-6 text-center text-slate-400">
                Don't have an account?{" "}
                <Link href="/signup" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
