/**
 * Generate a unique QR code string for a user
 * Format: NKYM-{timestamp}-{randomId}
 */
export function generateQRCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NKYM-${timestamp}-${randomPart}-${userId.substring(0, 8)}`;
}

/**
 * Validate QR code format
 */
export function isValidQRCode(code: string): boolean {
  return /^NKYM-[a-z0-9]+-[A-Z0-9]+-[a-f0-9]+$/i.test(code);
}
