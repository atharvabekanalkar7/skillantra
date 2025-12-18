// DEMO MODE — REMOVE AFTER REAL AUTH

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  college: string;
  avatar: string;
}

export function getDemoUser(): DemoUser {
  return {
    id: "demo-user-001",
    name: "Demo Student",
    email: "demo@students.iitmandi.ac.in",
    role: "student",
    college: "IIT Mandi",
    avatar: "DS",
  };
}

export function useDemoAuth() {
  return {
    user: getDemoUser(),
    isAuthenticated: true,
    loading: false,
  };
}

