import DashboardLayout from "../components/DashboardLayout";

export default function TasksPage() {
  const mockTasks = [
    {
      id: 1,
      title: "Frontend Developer Needed",
      description: "Looking for a React developer to build a dashboard UI",
      skills: ["React", "TypeScript", "Tailwind"],
      postedBy: "John Doe",
      postedAt: "2 days ago",
      applicants: 5,
    },
    {
      id: 2,
      title: "UI/UX Designer for Mobile App",
      description: "Need a designer to create wireframes and mockups",
      skills: ["Figma", "UI/UX", "Prototyping"],
      postedBy: "Jane Smith",
      postedAt: "3 days ago",
      applicants: 3,
    },
    {
      id: 3,
      title: "Backend API Development",
      description: "Building REST APIs with Node.js and Express",
      skills: ["Node.js", "Express", "MongoDB"],
      postedBy: "Mike Johnson",
      postedAt: "1 week ago",
      applicants: 8,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Browse Tasks</h1>
          <p className="mt-2 text-gray-400">
            Discover projects and tasks from students on your campus
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <button className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            All Skills
          </button>
          <button className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            Development
          </button>
          <button className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            Design
          </button>
          <button className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            Marketing
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {mockTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-gray-800 bg-gray-800/50 p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                  <p className="mt-2 text-gray-400">{task.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-600/20 px-3 py-1 text-xs text-blue-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>Posted by {task.postedBy}</span>
                    <span>•</span>
                    <span>{task.postedAt}</span>
                    <span>•</span>
                    <span>{task.applicants} applicants</span>
                  </div>
                </div>
                <button className="ml-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

