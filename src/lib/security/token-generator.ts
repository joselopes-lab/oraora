import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure token.
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}
