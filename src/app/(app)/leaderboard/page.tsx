import { AppCard } from '@/components/ui/app-card';

export default function LeaderboardPage() {
  return (
    <div className="opacity-0 animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-2">Leaderboard</h1>
        <p className="text-slate-400 text-sm sm:text-base">Coming soon</p>
      </div>

      <AppCard className="text-center p-8 sm:p-12">
        <div className="max-w-md mx-auto">
          <div className="text-5xl sm:text-6xl mb-4 text-slate-700">🏆</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-2">Leaderboard Coming Soon</h2>
          <p className="text-slate-400 mb-6 text-sm sm:text-base">
            We're building a leaderboard to showcase top contributors and active members on SkillAntra.
          </p>
          <p className="text-sm text-slate-500">
            Check back soon for updates!
          </p>
        </div>
      </AppCard>
    </div>
  );
}

