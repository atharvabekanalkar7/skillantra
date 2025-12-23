/**
 * Authentication utility functions
 */

import { createAuthError, AuthErrorCode } from './auth-errors';

// In-memory rate limiting store (for production, use Redis)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMITS = {
  resendConfirmation: {
    perEmail: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour per email
    perIP: { max: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour per IP
  },
  signup: {
    perEmail: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour per email
    perIP: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour per IP
  },
};

/**
 * Check rate limit for an action
 */
export function checkRateLimit(
  key: string,
  limit: { max: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Create new entry
    const resetAt = now + limit.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit.max - 1, resetAt };
  }

  if (entry.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: limit.max - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP (handles proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback (won't work in production but helps in dev)
  return 'unknown';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  if (password.length > 72) {
    return { valid: false, error: 'Password must be less than 72 characters' };
  }
  return { valid: true };
}

/**
 * Check if user is deleted (using service role client)
 */
export async function isUserDeleted(
  userId: string,
  adminClient: any
): Promise<boolean> {
  try {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    
    if (error || !data?.user) {
      return true; // User doesn't exist = deleted
    }
    
    // Check if user has deleted_at timestamp
    return data.user.deleted_at !== null && data.user.deleted_at !== undefined;
  } catch {
    return true; // On error, assume deleted for safety
  }
}

/**
 * Check if user email is confirmed
 */
export function isEmailConfirmed(user: any): boolean {
  return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
}

/**
 * Verify user email is confirmed using admin client
 * Returns the user data if confirmed, null otherwise
 */
export async function verifyEmailConfirmed(
  userId: string,
  adminClient: any
): Promise<{ confirmed: boolean; user?: any }> {
  try {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    
    if (error || !data?.user) {
      return { confirmed: false };
    }
    
    return {
      confirmed: isEmailConfirmed(data.user),
      user: data.user,
    };
  } catch {
    return { confirmed: false };
  }
}

/**
 * Generate idempotency key from request
 */
export function generateIdempotencyKey(email: string, timestamp: number): string {
  // Simple hash function (for production, use crypto.createHash)
  return `${email}-${timestamp}`;
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

