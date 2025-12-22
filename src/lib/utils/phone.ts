/**
 * Validates a phone number
 * Rules: numeric string, length 10-15
 */
export function validatePhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  // Remove any whitespace
  const cleaned = phone.trim();
  // Check if it's numeric and length is 10-15
  return /^[0-9]{10,15}$/.test(cleaned);
}

/**
 * Normalizes a phone number (removes whitespace)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.trim();
}


