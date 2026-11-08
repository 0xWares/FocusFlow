import crypto from 'crypto';

/**
 * Generates a random 16-byte hex salt.
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Derives a secure key using scrypt.
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Timing-safe password verification.
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computedHash = hashPassword(password, salt);
    const computedBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (computedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch {
    return false;
  }
}
