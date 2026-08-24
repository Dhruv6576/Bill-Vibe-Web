import { GSTState, InvoiceItem } from '../types';

// All 37 Indian GST State & Union Territory Codes according to GST Act
export const GST_STATES: GSTState[] = [
  { code: '01', name: 'Jammu and Kashmir', type: 'ut' },
  { code: '02', name: 'Himachal Pradesh', type: 'state' },
  { code: '03', name: 'Punjab', type: 'state' },
  { code: '04', name: 'Chandigarh', type: 'ut' },
  { code: '05', name: 'Uttarakhand', type: 'state' },
  { code: '06', name: 'Haryana', type: 'state' },
  { code: '07', name: 'Delhi', type: 'ut' },
  { code: '08', name: 'Rajasthan', type: 'state' },
  { code: '09', name: 'Uttar Pradesh', type: 'state' },
  { code: '10', name: 'Bihar', type: 'state' },
  { code: '11', name: 'Sikkim', type: 'state' },
  { code: '12', name: 'Arunachal Pradesh', type: 'state' },
  { code: '13', name: 'Nagaland', type: 'state' },
  { code: '14', name: 'Manipur', type: 'state' },
  { code: '15', name: 'Mizoram', type: 'state' },
  { code: '16', name: 'Tripura', type: 'state' },
  { code: '17', name: 'Meghalaya', type: 'state' },
  { code: '18', name: 'Assam', type: 'state' },
  { code: '19', name: 'West Bengal', type: 'state' },
  { code: '20', name: 'Jharkhand', type: 'state' },
  { code: '21', name: 'Odisha', type: 'state' },
  { code: '22', name: 'Chhattisgarh', type: 'state' },
  { code: '23', name: 'Madhya Pradesh', type: 'state' },
  { code: '24', name: 'Gujarat', type: 'state' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'ut' },
  { code: '27', name: 'Maharashtra', type: 'state' },
  { code: '29', name: 'Karnataka', type: 'state' },
  { code: '30', name: 'Goa', type: 'state' },
  { code: '31', name: 'Lakshadweep', type: 'ut' },
  { code: '32', name: 'Kerala', type: 'state' },
  { code: '33', name: 'Tamil Nadu', type: 'state' },
  { code: '34', name: 'Puducherry', type: 'ut' },
  { code: '35', name: 'Andaman and Nicobar Islands', type: 'ut' },
  { code: '36', name: 'Telangana', type: 'state' },
  { code: '37', name: 'Andhra Pradesh', type: 'state' },
  { code: '38', name: 'Ladakh', type: 'ut' },
  { code: '97', name: 'Other Territory', type: 'ut' },
];

export const GST_RATES = [0, 5, 12, 18, 28];

/**
 * Clean floating point arithmetic by rounding to 2 decimal places reliably
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Determine if a transaction is Inter-State (IGST) or Intra-State (CGST + SGST/UTGST)
 */
export function isInterStateSupply(businessStateCode?: string, customerStateCode?: string): boolean {
  if (!businessStateCode || !customerStateCode) return false;
  return businessStateCode.trim() !== customerStateCode.trim();
}

/**
 * Extract GST State Code from a 15-digit GSTIN (e.g. 24AABCS1429B1Z8 -> '24')
 */
export function getStateCodeFromGSTIN(gstin?: string): string {
  if (!gstin || gstin.length < 2) return '';
  const prefix = gstin.substring(0, 2);
  return /^\d{2}$/.test(prefix) ? prefix : '';
}

/**
 * Calculate single line item tax amounts
 */
export interface LineItemCalculationResult {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  total: number;
}

export function calculateLineItemTaxes(
  quantity: number,
  rate: number,
  discountPercent: number = 0,
  gstRate: number = 18,
  cessRate: number = 0,
  isInterstate: boolean = false,
  isInclusive: boolean = false
): LineItemCalculationResult {
  const qty = Math.max(0, quantity);
  const unitRate = Math.max(0, rate);
  const discount = Math.min(100, Math.max(0, discountPercent));

  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let cessAmount = 0;
  let total = 0;

  if (isInclusive && gstRate > 0) {
    // Total gross before item discount
    const grossAmount = qty * unitRate;
    const discountedGross = grossAmount * (1 - discount / 100);
    
    // Taxable = discountedGross / (1 + (gstRate + cessRate)/100)
    taxableAmount = round2(discountedGross / (1 + (gstRate + cessRate) / 100));
    
    if (isInterstate) {
      igstAmount = round2((taxableAmount * gstRate) / 100);
    } else {
      const halfRate = gstRate / 2;
      cgstAmount = round2((taxableAmount * halfRate) / 100);
      sgstAmount = round2((taxableAmount * halfRate) / 100);
    }
    
    if (cessRate > 0) {
      cessAmount = round2((taxableAmount * cessRate) / 100);
    }
    
    total = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount);
  } else {
    // Exclusive pricing
    const grossAmount = qty * unitRate;
    const itemDiscountAmount = (grossAmount * discount) / 100;
    taxableAmount = round2(grossAmount - itemDiscountAmount);

    if (isInterstate) {
      igstAmount = round2((taxableAmount * gstRate) / 100);
    } else {
      const halfRate = gstRate / 2;
      cgstAmount = round2((taxableAmount * halfRate) / 100);
      sgstAmount = round2((taxableAmount * halfRate) / 100);
    }

    if (cessRate > 0) {
      cessAmount = round2((taxableAmount * cessRate) / 100);
    }

    total = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount);
  }

  return {
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    total,
  };
}

/**
 * Calculate Invoice Grand Totals, Tax Breakdown, Discounts, and Mathematical Round-off
 */
export interface InvoiceCalculationSummary {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  shippingCharges: number;
  roundOff: number;
  grandTotal: number;
  balanceDue: number;
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  discountType: 'percentage' | 'fixed' = 'percentage',
  discountValue: number = 0,
  shippingCharges: number = 0,
  amountPaid: number = 0,
  isInterstate: boolean = false
): InvoiceCalculationSummary {
  let subtotal = 0;
  let itemsTaxable = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let cessTotal = 0;

  items.forEach((item) => {
    const calc = calculateLineItemTaxes(
      item.quantity,
      item.rate,
      item.discount_percent,
      item.gst_rate,
      item.cess_amount ? (item.cess_amount / (item.taxable_amount || 1)) * 100 : 0,
      isInterstate,
      false
    );
    subtotal += item.quantity * item.rate;
    itemsTaxable += calc.taxableAmount;
    cgstTotal += calc.cgstAmount;
    sgstTotal += calc.sgstAmount;
    igstTotal += calc.igstAmount;
    cessTotal += calc.cessAmount;
  });

  subtotal = round2(subtotal);
  itemsTaxable = round2(itemsTaxable);

  // Overall Invoice Discount
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = round2((itemsTaxable * Math.min(100, Math.max(0, discountValue))) / 100);
  } else {
    discountAmount = round2(Math.min(itemsTaxable, Math.max(0, discountValue)));
  }

  // Adjust tax if overall discount applied
  let taxableAmount = round2(itemsTaxable - discountAmount);
  
  if (discountAmount > 0 && itemsTaxable > 0) {
    const ratio = taxableAmount / itemsTaxable;
    cgstTotal = round2(cgstTotal * ratio);
    sgstTotal = round2(sgstTotal * ratio);
    igstTotal = round2(igstTotal * ratio);
    cessTotal = round2(cessTotal * ratio);
  }

  cgstTotal = round2(cgstTotal);
  sgstTotal = round2(sgstTotal);
  igstTotal = round2(igstTotal);
  cessTotal = round2(cessTotal);

  const totalTax = round2(cgstTotal + sgstTotal + igstTotal + cessTotal);
  const rawTotal = taxableAmount + totalTax + Math.max(0, shippingCharges);
  
  // Mathematical round-off to nearest integer rupee
  const grandTotal = Math.round(rawTotal);
  const roundOff = round2(grandTotal - rawTotal);
  const balanceDue = round2(Math.max(0, grandTotal - Math.max(0, amountPaid)));

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount: cgstTotal,
    sgstAmount: sgstTotal,
    igstAmount: igstTotal,
    cessAmount: cessTotal,
    totalTax,
    shippingCharges: round2(Math.max(0, shippingCharges)),
    roundOff,
    grandTotal,
    balanceDue,
  };
}
