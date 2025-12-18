import DashboardLayout from "../components/DashboardLayout";

export default function MyTasksPage() {
  const mockMyTasks = [
    {
      id: 1,
      title: "Web App Design",
      status: "In Progress",
      progress: 60,
      dueDate: "Dec 25, 2024",
      collaborators: 2,
    },
    {
      id: 2,
      title: "API Documentation",
      status: "Pending",
      progress: 0,
      dueDate: "Jan 5, 2025",
      collaborators: 1,
    },
    {
      id: 3,
      title: "Mobile App Prototype",
      status: "In Progress",
      progress: 30,
      dueDate: "Jan 10, 2025",
      collaborators: 3,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Tasks</h1>
          <p className="mt-2 text-gray-400">
            Manage tasks you're working on or have created
          </p>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {mockMyTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-gray-800 bg-gray-800/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        task.status === "In Progress"
                          ? "bg-blue-600/20 text-blue-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-300">{task.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>Due: {task.dueDate}</span>
                    <span>•</span>
                    <span>{task.collaborators} collaborators</span>
                  </div>
                </div>
                <button className="ml-4 rounded-lg border border-gray-700 bg-gray-800 px-6 py-2 font-medium text-white hover:bg-gray-700">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

