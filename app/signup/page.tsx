"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans">
      <div className="mx-auto max-w-md px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            SkillAntra
          </h1>
        </header>

        {/* Signup Card */}
        <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
          <div className="w-full">
            <h2 className="mb-8 text-center text-3xl font-semibold text-white">
              Create your SkillAntra account
            </h2>

            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-8 shadow-2xl">
              <form className="flex flex-col gap-5">
                {/* Full Name Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      👤
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue="John Doe"
                      className="h-12 w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-4 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* College Email Input */}
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
                      defaultValue="you@college.edu"
                      className="h-12 w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-4 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="you@college.edu"
                    />
                  </div>
                </div>

                {/* College/University Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="college" className="text-sm font-medium text-slate-300">
                    College/University
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      🏛️
                    </div>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      defaultValue="IIT Delhi"
                      className="h-12 w-full rounded-lg border border-indigo-500 bg-slate-700/50 pl-10 pr-4 text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="Enter your college"
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
                      placeholder="Create a strong password"
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

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-300">
                    I agree to the{" "}
                    <Link href="#" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl"
                >
                  Create Account
                  <span>→</span>
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-700"></div>
                <span className="text-sm text-slate-400">or sign up with</span>
                <div className="h-px flex-1 bg-slate-700"></div>
              </div>

              {/* Social Sign Up */}
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

              {/* Login Link */}
              <p className="mt-6 text-center text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
