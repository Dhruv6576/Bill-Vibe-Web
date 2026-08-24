/**
 * Format monetary amount according to Indian numbering system (Lakhs & Crores)
 * Example: 154500.5 -> "₹ 1,54,500.50"
 */
export function formatINR(amount: number = 0, showSymbol: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const prefix = showSymbol ? '₹ ' : '';
  return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

/**
 * Format ISO date string into readable Indian format (DD/MM/YYYY or DD MMM YYYY)
 */
export function formatDate(dateString?: string, format: 'short' | 'long' = 'short'): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (format === 'long') {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
