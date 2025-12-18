import DashboardLayout from "../components/DashboardLayout";

export default function LeaderboardPage() {
  const mockLeaderboard = [
    { rank: 1, name: "Sarah Johnson", points: 1250, tasks: 15 },
    { rank: 2, name: "Mike Chen", points: 1100, tasks: 12 },
    { rank: 3, name: "Emily Davis", points: 980, tasks: 10 },
    { rank: 4, name: "John Doe", points: 850, tasks: 8 },
    { rank: 5, name: "Alex Smith", points: 720, tasks: 7 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="mt-2 text-gray-400">
            Top contributors and active collaborators on campus
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
          <div className="space-y-4">
            {mockLeaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                    entry.rank === 1
                      ? "bg-yellow-600/20 text-yellow-400"
                      : entry.rank === 2
                      ? "bg-gray-400/20 text-gray-400"
                      : entry.rank === 3
                      ? "bg-orange-600/20 text-orange-400"
                      : "bg-gray-700/20 text-gray-500"
                  }`}
                >
                  {entry.rank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{entry.name}</p>
                  <p className="text-sm text-gray-400">
                    {entry.tasks} tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">{entry.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

