"use client";

import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#04060f] text-slate-100 selection:bg-indigo-500/30">
      <div className="max-w-md w-full text-center space-y-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8">

        <h1 className="text-2xl font-semibold">
          Sign up coming soon 🚀
        </h1>

        <p className="text-sm text-white/70">
          We're currently in early access mode.
          <br />
          You can explore the demo or join the waitlist.
        </p>

        <div className="flex flex-col gap-3">

          <button
            onClick={() => router.push("/dashboard?demo=true")}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Explore Demo
          </button>

          <button
            onClick={() => router.push("/join-waitlist")}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
          >
            Join Waitlist
          </button>

        </div>

      </div>
    </div>
  );
}
