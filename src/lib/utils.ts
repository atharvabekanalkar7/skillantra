import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function parseSkills(skills: string | null): string[] {
  if (!skills) return [];
  return skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export function formatSkills(skills: string[]): string {
  return skills.map(s => s.trim()).filter(s => s.length > 0).join(', ');
}

