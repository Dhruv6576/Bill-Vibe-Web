import QRCode from 'qrcode';

export interface UPILinkParams {
  upiId: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  transactionRef?: string;
}

/**
 * Generate standard NPCI compliant UPI Intent URI
 * upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function generateUPIPaymentString({
  upiId,
  payeeName,
  amount,
  transactionNote,
  transactionRef,
}: UPILinkParams): string {
  if (!upiId) return '';

  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(payeeName.trim());
  let uri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`;

  if (amount && amount > 0) {
    uri += `&am=${amount.toFixed(2)}`;
  }
  if (transactionNote) {
    uri += `&tn=${encodeURIComponent(transactionNote.slice(0, 50))}`;
  }
  if (transactionRef) {
    uri += `&tr=${encodeURIComponent(transactionRef)}`;
  }

  return uri;
}

/**
 * Generate Data URL QR Code image from a string
 */
export async function generateQRCodeDataUrl(data: string): Promise<string> {
  if (!data) return '';
  try {
    return await QRCode.toDataURL(data, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
