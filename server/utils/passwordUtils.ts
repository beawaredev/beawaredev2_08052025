import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Higher rounds = more secure but slower

/**
 * Hash a password using bcrypt with a secure salt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Check if a password meets security requirements
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
    };
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one special character' 
    };
  }
  
  return { isValid: true, message: 'Password meets security requirements' };
}