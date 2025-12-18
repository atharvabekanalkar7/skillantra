"use client";

// DEMO MODE — REMOVE AFTER REAL AUTH

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Browse Tasks", href: "/tasks", icon: "🔍" },
  { name: "My Tasks", href: "/my-tasks", icon: "📋" },
  { name: "My Applications", href: "/applications", icon: "📝" },
  { name: "Messages", href: "/messages", icon: "💬" },
  { name: "Leaderboard", href: "/leaderboard", icon: "🏆" },
  { name: "Profile", href: "/profile", icon: "👤" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user ? getInitials(user.name) : "DS";

  const isDark = theme === "dark";

  return (
    <div
      className={`flex h-screen font-sans transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r backdrop-blur-md transition-colors ${
          isDark
            ? "border-blue-500/30 bg-slate-900/90"
            : "border-gray-200 bg-white/95"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={`border-b p-6 transition-colors ${
              isDark ? "border-blue-500/30" : "border-gray-200"
            }`}
          >
            <h1
              className={`text-2xl font-bold bg-clip-text text-transparent ${
                isDark
                  ? "bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600"
              }`}
            >
              SkillAntra
            </h1>
          </div>

          {/* User Info in Sidebar */}
          {user && (
            <div
              className={`border-b p-4 transition-colors ${
                isDark ? "border-blue-500/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg transition-transform hover:scale-110 ${
                    isDark
                      ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600"
                  }`}
                >
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user.name}
                  </p>
                  <p
                    className={`truncate text-xs ${
                      isDark ? "text-blue-300/70" : "text-gray-500"
                    }`}
                  >
                    {user.college}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : isDark
                      ? "text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 hover:border-l-2 hover:border-blue-500"
                      : "text-gray-700 hover:bg-gray-100 hover:text-indigo-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
            isDark
              ? "border-blue-500/30 bg-slate-900/90"
              : "border-gray-200 bg-white/95"
          }`}
        >
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="search"
                placeholder="Search tasks, projects, people..."
                className={`w-full rounded-lg border px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 ${
                  isDark
                    ? "border-blue-500/30 bg-slate-800/50 text-white placeholder-blue-300/50 focus:border-blue-500 focus:ring-blue-500/30 focus:shadow-lg focus:shadow-blue-500/20"
                    : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
              />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Demo Mode Badge */}
              <div
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border shadow-lg animate-pulse ${
                  isDark
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/30"
                    : "bg-amber-100 text-amber-700 border-amber-300"
                }`}
              >
                🚀 DEMO MODE
              </div>

              {/* Notification Icon */}
              <button
                className={`relative rounded-lg p-2 transition-all duration-200 hover:scale-110 ${
                  isDark
                    ? "text-slate-300 hover:bg-blue-500/10 hover:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 hover:text-indigo-700"
                }`}
              >
                <span className="text-xl">🔔</span>
                <span
                  className={`absolute right-1 top-1 h-2 w-2 rounded-full shadow-lg animate-pulse ${
                    isDark ? "bg-red-500 shadow-red-500/50" : "bg-red-500"
                  }`}
                ></span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`rounded-lg p-2 transition-all duration-200 hover:scale-110 ${
                  isDark
                    ? "text-slate-300 hover:bg-blue-500/10 hover:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 hover:text-indigo-700"
                }`}
                title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              >
                <span className="text-xl">{isDark ? "🌙" : "☀️"}</span>
              </button>

              {/* User Avatar */}
              {user && (
                <button
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl ${
                    isDark
                      ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 hover:shadow-blue-500/50"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600"
                  }`}
                >
                  <span className="text-sm font-semibold">{userInitials}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 overflow-y-auto p-6 transition-colors ${
            isDark ? "bg-gradient-to-br from-slate-950 via-blue-950/30 to-indigo-950/30" : "bg-gray-50"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
