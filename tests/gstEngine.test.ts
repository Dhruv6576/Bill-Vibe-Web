import { describe, it, expect } from 'vitest';
import {
  isInterStateSupply,
  getStateCodeFromGSTIN,
  calculateLineItemTaxes,
  calculateInvoiceTotals,
  round2,
} from '../src/utils/gstEngine';

describe('GST Calculation Engine', () => {
  it('identifies intra-state vs inter-state supply correctly', () => {
    // Same state (Gujarat to Gujarat) -> Intra-state
    expect(isInterStateSupply('24', '24')).toBe(false);

    // Different state (Gujarat 24 to Maharashtra 27) -> Inter-state
    expect(isInterStateSupply('24', '27')).toBe(true);

    // Missing state defaults to false
    expect(isInterStateSupply(undefined, '27')).toBe(false);
  });

  it('extracts GST state code from 15-digit GSTIN string', () => {
    expect(getStateCodeFromGSTIN('24AABCS1429B1Z8')).toBe('24');
    expect(getStateCodeFromGSTIN('27AABCT9988C1Z2')).toBe('27');
    expect(getStateCodeFromGSTIN('INVALID')).toBe('');
  });

  it('calculates intra-state 18% GST (9% CGST + 9% SGST) correctly', () => {
    // 2 items @ Rs 1000 with 10% discount = Rs 1800 taxable
    const result = calculateLineItemTaxes(2, 1000, 10, 18, 0, false, false);

    expect(result.taxableAmount).toBe(1800);
    expect(result.cgstAmount).toBe(162); // 9% of 1800
    expect(result.sgstAmount).toBe(162); // 9% of 1800
    expect(result.igstAmount).toBe(0);
    expect(result.total).toBe(2124); // 1800 + 162 + 162
  });

  it('calculates inter-state 18% IGST correctly', () => {
    // 1 item @ Rs 50000 with 0% discount = Rs 50000 taxable
    const result = calculateLineItemTaxes(1, 50000, 0, 18, 0, true, false);

    expect(result.taxableAmount).toBe(50000);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstAmount).toBe(9000); // 18% of 50000
    expect(result.total).toBe(59000);
  });

  it('computes complete invoice totals with round-off and balance due', () => {
    const items = [
      {
        name: 'Product A',
        quantity: 2,
        unit: 'PCS',
        rate: 28990,
        discount_percent: 0,
        taxable_amount: 57980,
        gst_rate: 18,
        cgst_amount: 5218.20,
        sgst_amount: 5218.20,
        igst_amount: 0,
        cess_amount: 0,
        total: 68416.40,
      },
    ];

    const totals = calculateInvoiceTotals(items, 'fixed', 0, 0, 50000, false);

    expect(totals.subtotal).toBe(57980);
    expect(totals.taxableAmount).toBe(57980);
    expect(totals.cgstAmount).toBe(5218.20);
    expect(totals.sgstAmount).toBe(5218.20);
    expect(totals.grandTotal).toBe(68416); // 68416.40 rounds to nearest integer 68416
    expect(totals.roundOff).toBe(-0.40);
    expect(totals.balanceDue).toBe(18416); // 68416 - 50000 paid
  });
});
