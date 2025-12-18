"use client";

// DEMO MODE — REMOVE AFTER REAL AUTH

import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

type UserType = "seeker" | "holder" | "both";

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [userType, setUserType] = useState<UserType>("both");
  const mockSkills = ["React", "TypeScript", "Node.js", "UI/UX Design"];
  const mockProjects = [
    { id: 1, name: "E-Commerce Platform", status: "Completed" },
    { id: 2, name: "Task Management App", status: "In Progress" },
  ];

  const isDark = theme === "dark";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user ? getInitials(user.name) : "DS";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1
            className={`text-3xl font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Profile
          </h1>
          <p
            className={`mt-2 ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}
          >
            Manage your profile and showcase your skills
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div
              className={`rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
                isDark
                  ? "border-blue-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-blue-400 hover:shadow-blue-500/20"
                  : "border-gray-200 bg-white hover:border-indigo-300"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-xl transition-transform hover:scale-110 ${
                    isDark
                      ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 hover:shadow-blue-500/50"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600"
                  }`}
                >
                  {userInitials}
                </div>
                <h2
                  className={`mt-4 text-2xl font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user?.name || "Demo Student"}
                </h2>
                <p
                  className={`mt-1 ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}
                >
                  Student
                </p>
                <p
                  className={`mt-2 text-sm ${
                    isDark ? "text-slate-500" : "text-gray-500"
                  }`}
                >
                  {user?.college || "IIT Mandi"}
                </p>

                {/* User Type Selector */}
                <div className="mt-6 w-full">
                  <label
                    className={`mb-3 block text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-cyan-400" : "text-indigo-600"
                    }`}
                  >
                    I am a
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setUserType("seeker")}
                      className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                        userType === "seeker"
                          ? isDark
                            ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 shadow-lg shadow-blue-500/30"
                            : "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                          : isDark
                          ? "bg-slate-800/50 text-slate-400 border-2 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                          : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      SkillSeeker
                    </button>
                    <button
                      onClick={() => setUserType("holder")}
                      className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                        userType === "holder"
                          ? isDark
                            ? "bg-purple-500/20 text-purple-400 border-2 border-purple-500/50 shadow-lg shadow-purple-500/30"
                            : "bg-purple-100 text-purple-700 border-2 border-purple-300"
                          : isDark
                          ? "bg-slate-800/50 text-slate-400 border-2 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                          : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      SkillHolder
                    </button>
                    <button
                      onClick={() => setUserType("both")}
                      className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                        userType === "both"
                          ? isDark
                            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-2 border-blue-500/30 shadow-lg shadow-indigo-500/30"
                            : "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-2 border-indigo-300"
                          : isDark
                          ? "bg-slate-800/50 text-slate-400 border-2 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                          : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      Both
                    </button>
                  </div>
                </div>

                <button
                  className={`mt-6 w-full rounded-lg px-4 py-2.5 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    isDark
                      ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 shadow-lg shadow-blue-500/30"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                  }`}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div
              className={`rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
                isDark
                  ? "border-indigo-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-indigo-400 hover:shadow-indigo-500/20"
                  : "border-gray-200 bg-white hover:border-indigo-300"
              }`}
            >
              <h3
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                About
              </h3>
              <p
                className={`mt-4 ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}
              >
                Passionate developer and designer. Love building products that make a difference.
              </p>
            </div>

            {/* Skills */}
            <div
              className={`rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
                isDark
                  ? "border-emerald-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-emerald-400 hover:shadow-emerald-500/20"
                  : "border-gray-200 bg-white hover:border-emerald-300"
              }`}
            >
              <h3
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Skills
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {mockSkills.map((skill) => (
                  <span
                    key={skill}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      isDark
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20"
                        : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div
              className={`rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
                isDark
                  ? "border-purple-500/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-purple-400 hover:shadow-purple-500/20"
                  : "border-gray-200 bg-white hover:border-purple-300"
              }`}
            >
              <h3
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Projects
              </h3>
              <div className="mt-4 space-y-3">
                {mockProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between rounded-lg border-2 p-4 transition-all duration-200 hover:scale-[1.02] ${
                      isDark
                        ? "border-blue-500/20 bg-slate-800/30 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10"
                        : "border-gray-200 bg-gray-50 hover:border-indigo-200"
                    }`}
                  >
                    <div>
                      <p
                        className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {project.name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-slate-500" : "text-gray-500"
                        }`}
                      >
                        {project.status}
                      </p>
                    </div>
                    <button
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        isDark
                          ? "border-cyan-500/30 bg-slate-800/50 text-cyan-400 hover:bg-slate-800"
                          : "border-gray-300 bg-white text-indigo-600 hover:bg-gray-50"
                      }`}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
