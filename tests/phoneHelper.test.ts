import { describe, it, expect } from 'vitest';
import { cleanPhoneNumber } from '../src/utils/phoneHelper';

describe('cleanPhoneNumber', () => {
  it('should clean for WhatsApp and APIs', () => {
    expect(cleanPhoneNumber('+91 98765 43210')).toBe('919876543210');
    expect(cleanPhoneNumber('9876543210')).toBe('919876543210');
  });
});
