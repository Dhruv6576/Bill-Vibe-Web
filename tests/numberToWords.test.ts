import { describe, it, expect } from 'vitest';
import { numberToWordsINR } from '../src/utils/numberToWords';

describe('Indian Number to Words (INR) Engine', () => {
  it('converts zero correctly', () => {
    expect(numberToWordsINR(0)).toBe('Zero Rupees Only');
  });

  it('converts small amounts', () => {
    expect(numberToWordsINR(45)).toBe('Forty-Five Rupees Only');
    expect(numberToWordsINR(500)).toBe('Five Hundred Rupees Only');
  });

  it('converts Thousands, Lakhs and Crores', () => {
    expect(numberToWordsINR(12500)).toBe('Twelve Thousand Five Hundred Rupees Only');
    expect(numberToWordsINR(150000)).toBe('One Lakh Fifty Thousand Rupees Only');
    expect(numberToWordsINR(2540050)).toBe('Twenty-Five Lakh Forty Thousand Fifty Rupees Only');
    expect(numberToWordsINR(10500000)).toBe('One Crore Five Lakh Rupees Only');
  });

  it('converts decimal amounts with Paise', () => {
    expect(numberToWordsINR(1250.50)).toBe('One Thousand Two Hundred Fifty Rupees and Fifty Paise Only');
    expect(numberToWordsINR(0.75)).toBe('Seventy-Five Paise Only');
  });
});
