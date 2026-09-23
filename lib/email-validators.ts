/**
 * Email validation utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload.to) {
    return { valid: false, error: 'Email address (to) is required' };
  }

  if (!isValidEmail(payload.to)) {
    return { valid: false, error: 'Invalid email address' };
  }

  if (!payload.template) {
    return { valid: false, error: 'Email template is required' };
  }

  const validTemplates = ['welcome', 'password-reset', 'notification', 'auth-code'];
  if (!validTemplates.includes(payload.template)) {
    return { valid: false, error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` };
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { valid: false, error: 'Email data object is required' };
  }

  return { valid: true };
}

/**
 * Generate secure auth codes
 */
export function generateAuthCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

/**
 * Generate reset token
 */
export function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Check if auth code has expired (10 minutes)
 */
export function isAuthCodeExpired(createdAt: Date): boolean {
  const tenMinutes = 10 * 60 * 1000;
  return Date.now() - createdAt.getTime() > tenMinutes;
}

/**
 * Check if reset token has expired (24 hours)
 */
export function isResetTokenExpired(createdAt: Date): boolean {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - createdAt.getTime() > twentyFourHours;
}

/**
 * Rate limiting for email sends (basic in-memory implementation)
 * For production, use Redis or database
 */
const emailRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkEmailRateLimit(email: string, maxPerHour: number = 5): boolean {
  const now = Date.now();
  const limit = emailRateLimits.get(email);

  if (!limit || limit.resetTime < now) {
    // Reset limit window
    emailRateLimits.set(email, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }

  if (limit.count >= maxPerHour) {
    return false; // Rate limit exceeded
  }

  limit.count++;
  return true;
}

export function clearEmailRateLimit(email: string): void {
  emailRateLimits.delete(email);
}
