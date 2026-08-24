/**
 * Formats Indian Phone Numbers to +91 XXXXX XXXXX standard format.
 * Accepts only numbers and auto-formats as the user types.
 */
export function formatIndianPhoneNumber(value: string): string {
  if (!value) return '';

  // Extract all digits
  let digits = value.replace(/\D/g, '');

  // If user pasted with country code (91) and length > 10, strip leading 91
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }

  // Cap at 10 digits
  digits = digits.slice(0, 10);

  if (digits.length === 0) return '';
  if (digits.length <= 5) {
    return `+91 ${digits}`;
  }
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
}

/**
 * Extracts clean 10-digit or standard international phone for database / WhatsApp API
 */
export function cleanPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    return digits;
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}
