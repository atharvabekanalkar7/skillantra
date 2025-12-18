import DashboardLayout from "../components/DashboardLayout";

export default function MessagesPage() {
  const mockConversations = [
    {
      id: 1,
      name: "Sarah Johnson",
      lastMessage: "Thanks for the update!",
      time: "2 hours ago",
      unread: 2,
    },
    {
      id: 2,
      name: "Mike Chen",
      lastMessage: "Can we schedule a meeting?",
      time: "5 hours ago",
      unread: 0,
    },
    {
      id: 3,
      name: "Emily Davis",
      lastMessage: "The design looks great!",
      time: "1 day ago",
      unread: 0,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="mt-2 text-gray-400">
            Communicate with your collaborators and teammates
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-4">
              <h2 className="mb-4 text-lg font-semibold text-white">Conversations</h2>
              <div className="space-y-2">
                {mockConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-left hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {conversation.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">{conversation.name}</p>
                          {conversation.unread > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-gray-400">
                          {conversation.lastMessage}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{conversation.time}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message View */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
              <div className="flex h-[500px] flex-col">
                <div className="mb-4 border-b border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-white">Select a conversation</h3>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-gray-500">No messages yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

