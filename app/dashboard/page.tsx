"use client";

import DashboardLayout from "../components/DashboardLayout";
import { useTheme } from "../context/ThemeContext";

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1
            className={`text-3xl font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Dashboard
          </h1>
          <p
            className={`mt-2 ${
              isDark ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Overview of your tasks, applications, and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div
            className={`group rounded-xl border-2 p-6 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDark
                ? "border-blue-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-blue-400 hover:shadow-blue-500/20"
                : "border-gray-200 bg-white hover:border-indigo-300"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                isDark ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Active Tasks
            </div>
            <div
              className={`mt-2 text-3xl font-bold bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-cyan-400 to-indigo-400"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600"
              }`}
            >
              3
            </div>
          </div>
          <div
            className={`group rounded-xl border-2 p-6 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDark
                ? "border-cyan-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-cyan-400 hover:shadow-cyan-500/20"
                : "border-gray-200 bg-white hover:border-cyan-300"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                isDark ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Applications
            </div>
            <div
              className={`mt-2 text-3xl font-bold bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600"
              }`}
            >
              5
            </div>
          </div>
          <div
            className={`group rounded-xl border-2 p-6 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDark
                ? "border-purple-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-purple-400 hover:shadow-purple-500/20"
                : "border-gray-200 bg-white hover:border-purple-300"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                isDark ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Messages
            </div>
            <div
              className={`mt-2 text-3xl font-bold bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-purple-400 to-pink-400"
                  : "bg-gradient-to-r from-purple-600 to-pink-600"
              }`}
            >
              2
            </div>
          </div>
          <div
            className={`group rounded-xl border-2 p-6 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDark
                ? "border-emerald-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-emerald-400 hover:shadow-emerald-500/20"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                isDark ? "text-slate-300" : "text-gray-700"
              }`}
            >
              Completed
            </div>
            <div
              className={`mt-2 text-3xl font-bold bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600"
              }`}
            >
              12
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className={`rounded-xl border-2 p-6 backdrop-blur-sm shadow-lg transition-all duration-300 ${
            isDark
              ? "border-indigo-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-indigo-400 hover:shadow-indigo-500/20"
              : "border-gray-200 bg-white hover:border-indigo-300"
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Recent Activity
          </h2>
          <div className="mt-4 space-y-4">
            <div
              className={`flex items-center gap-4 border-b pb-4 ${
                isDark ? "border-cyan-500/10" : "border-gray-200"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
                  isDark
                    ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/20"
                    : "bg-indigo-100 text-indigo-600 border-indigo-200"
                }`}
              >
                ✓
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Task completed: Web App Design
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  2 hours ago
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-4 border-b pb-4 ${
                isDark ? "border-cyan-500/10" : "border-gray-200"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
                  isDark
                    ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/20"
                    : "bg-emerald-100 text-emerald-600 border-emerald-200"
                }`}
              >
                📝
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Application submitted: Mobile Dev Project
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  5 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
                  isDark
                    ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/20"
                    : "bg-purple-100 text-purple-600 border-purple-200"
                }`}
              >
                💬
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  New message from Sarah
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  1 day ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
