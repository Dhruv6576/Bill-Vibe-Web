/**
 * Converts a numeric amount to Indian English Words (Rupees & Paise)
 * Example: 125450.50 -> "One Lakh Twenty-Five Thousand Four Hundred Fifty Rupees and Fifty Paise Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertTwoDigits(num: number): string {
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return one === 0 ? TENS[ten] : `${TENS[ten]}-${ONES[one]}`;
}

function convertThreeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  let res = '';
  if (hundred > 0) {
    res += `${ONES[hundred]} Hundred`;
  }
  if (remainder > 0) {
    if (res) res += ' ';
    res += convertTwoDigits(remainder);
  }
  return res;
}

export function numberToWordsINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    let rem = rupees % 10000000;

    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;

    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;

    const hundredBlock = rem;

    const parts: string[] = [];

    if (crore > 0) {
      parts.push(`${convertTwoDigits(crore)} Crore`);
    }
    if (lakh > 0) {
      parts.push(`${convertTwoDigits(lakh)} Lakh`);
    }
    if (thousand > 0) {
      parts.push(`${convertTwoDigits(thousand)} Thousand`);
    }
    if (hundredBlock > 0) {
      parts.push(convertThreeDigits(hundredBlock));
    }

    result = parts.join(' ') + ' Rupees';
  }

  if (paise > 0) {
    const paiseWords = convertTwoDigits(paise);
    if (result) {
      result += ` and ${paiseWords} Paise`;
    } else {
      result = `${paiseWords} Paise`;
    }
  }

  result += ' Only';

  return isNegative ? `Minus ${result}` : result;
}
