"use client";

// DEMO MODE — REMOVE AFTER REAL AUTH

import { createContext, useContext, ReactNode } from "react";
import { getDemoUser, DemoUser } from "../lib/demoAuth";

interface AuthContextType {
  user: DemoUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // DEMO MODE: Always return demo user
  const demoUser = getDemoUser();

  return (
    <AuthContext.Provider
      value={{
        user: demoUser,
        isAuthenticated: true,
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

