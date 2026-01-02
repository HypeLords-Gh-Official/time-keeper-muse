/**
 * Generate a unique QR code string for a user (for display purposes)
 * Format: NKYM-{timestamp}-{randomId}
 */
export function generateQRCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NKYM-${timestamp}-${randomPart}-${userId.substring(0, 8)}`;
}

/**
 * Generate a secure token for QR login authentication
 * This token is cryptographically secure and used for passwordless login
 */
export function generateQRToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate QR code format
 */
export function isValidQRCode(code: string): boolean {
  return /^NKYM-[a-z0-9]+-[A-Z0-9]+-[a-f0-9]+$/i.test(code);
}

/**
 * Validate QR token format (64 hex characters)
 */
export function isValidQRToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}
