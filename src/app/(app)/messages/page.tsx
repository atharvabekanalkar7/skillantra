export default function MessagesPage() {
  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-white/80 text-sm sm:text-base">Coming soon</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 sm:p-12 text-center border border-purple-400/30">
        <div className="max-w-md mx-auto">
          <div className="text-5xl sm:text-6xl mb-4">💬</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Messages Coming Soon</h2>
          <p className="text-white/80 mb-6 text-sm sm:text-base">
            We're working on bringing you a messaging feature to communicate with other users on SkillAntra.
          </p>
          <p className="text-sm text-white/60">
            Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
}

