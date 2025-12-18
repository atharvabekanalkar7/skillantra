"use client";
import DashboardLayout from "../components/DashboardLayout";

export default function ApplicationsPage() {
  const mockApplications = [
    {
      id: 1,
      taskTitle: "Frontend Developer Needed",
      status: "Pending",
      appliedAt: "2 days ago",
      postedBy: "John Doe",
    },
    {
      id: 2,
      taskTitle: "UI/UX Designer for Mobile App",
      status: "Accepted",
      appliedAt: "5 days ago",
      postedBy: "Jane Smith",
    },
    {
      id: 3,
      taskTitle: "Backend API Development",
      status: "Rejected",
      appliedAt: "1 week ago",
      postedBy: "Mike Johnson",
    },
    {
      id: 4,
      taskTitle: "Content Writer Needed",
      status: "Pending",
      appliedAt: "3 days ago",
      postedBy: "Sarah Williams",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-600/20 text-green-400";
      case "Rejected":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-yellow-600/20 text-yellow-400";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Applications</h1>
          <p className="mt-2 text-gray-400">
            Track the status of your task applications
          </p>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {mockApplications.map((application) => (
            <div
              key={application.id}
              className="rounded-xl border border-gray-800 bg-gray-800/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-white">
                      {application.taskTitle}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>Posted by {application.postedBy}</span>
                    <span>•</span>
                    <span>Applied {application.appliedAt}</span>
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

