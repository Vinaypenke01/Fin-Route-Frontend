/**
 * Password and Mobile Number Validation Utilities for FinRoute Auth
 */

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push("at least 8 characters");
  if (!hasUppercase) errors.push("one uppercase letter (A-Z)");
  if (!hasLowercase) errors.push("one lowercase letter (a-z)");
  if (!hasNumber) errors.push("one number (0-9)");
  if (!hasSpecialChar) errors.push("one special symbol (!@#$%^&*)");

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    isValid,
    errors,
  };
}

export function validateMobileNumber(rawMobile: string): { isValid: boolean; cleaned: string; error?: string } {
  let cleaned = rawMobile.replace(/\D/g, "");

  // Only strip 91 country code if the total string is 12 digits (e.g. 919876543210 or +919876543210)
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }

  if (!cleaned) {
    return { isValid: false, cleaned, error: "Mobile number is required." };
  }

  if (cleaned.length !== 10) {
    return { isValid: false, cleaned, error: "Mobile number must be a valid 10-digit Indian number." };
  }

  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, cleaned, error: "Mobile number must start with 6, 7, 8, or 9 (e.g. 9876543210)." };
  }

  return { isValid: true, cleaned };
}
