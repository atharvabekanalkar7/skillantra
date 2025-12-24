/**
 * Standardized authentication error responses
 */

export enum AuthErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  
  // Validation errors
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  MISSING_FIELDS = 'MISSING_FIELDS',
  
  // Signup errors
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  SIGNUP_FAILED = 'SIGNUP_FAILED',
  
  // Login errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  // Confirmation errors
  ALREADY_CONFIRMED = 'ALREADY_CONFIRMED',
  CONFIRMATION_FAILED = 'CONFIRMATION_FAILED',
  RESEND_RATE_LIMIT = 'RESEND_RATE_LIMIT',
  
  // Account deletion errors
  DELETE_FAILED = 'DELETE_FAILED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface AuthErrorResponse {
  error: string;
  code: AuthErrorCode;
  details?: string;
}

export function createAuthError(
  code: AuthErrorCode,
  message: string,
  details?: string
): AuthErrorResponse {
  return {
    error: message,
    code,
    ...(details && { details }),
  };
}

export function isAuthError(error: any): error is AuthErrorResponse {
  return error && typeof error === 'object' && 'code' in error && 'error' in error;
}

