import Papa from 'papaparse';

/**
 * Trigger browser download of CSV string
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export array of objects to CSV file
 */
export function exportToCSV<T extends object>(filename: string, data: T[]): void {
  if (!data || !data.length) return;
  const csv = Papa.unparse(data, {
    quotes: true,
    header: true,
  });
  downloadCSV(filename, csv);
}

/**
 * Parse uploaded CSV file to typed JSON array
 */
export function parseCSVFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Download sample CSV template for Customer / Supplier import
 */
export function downloadPartyTemplateCSV(): void {
  const sampleData = [
    {
      Type: 'customer',
      Name: 'Aarav Sharma',
      BusinessName: 'Sharma Trading Co.',
      Phone: '9876543210',
      Email: 'aarav@sharma.in',
      GSTIN: '24AAACA1234F1Z5',
      PAN: 'AAACA1234F',
      Address: '101, Galaxy Complex, MG Road',
      City: 'Ahmedabad',
      State: 'Gujarat',
      StateCode: '24',
      Pincode: '380001',
      OpeningBalance: '15000',
      CreditLimit: '50000',
    },
    {
      Type: 'supplier',
      Name: 'Sanjay Gupta',
      BusinessName: 'Gupta Wholesale Hub',
      Phone: '9898011223',
      Email: 'sanjay@guptawholesale.com',
      GSTIN: '27AABCS9988D1Z2',
      PAN: 'AABCS9988D',
      Address: 'Shop 4, APMC Market',
      City: 'Mumbai',
      State: 'Maharashtra',
      StateCode: '27',
      Pincode: '400001',
      OpeningBalance: '0',
      CreditLimit: '200000',
    },
  ];
  exportToCSV('parties_import_template', sampleData);
}

/**
 * Download sample CSV template for Product import
 */
export function downloadProductTemplateCSV(): void {
  const sampleData = [
    {
      Name: 'Wireless Bluetooth Mouse',
      SKU: 'ACC-MOU-01',
      HSN: '84716060',
      Category: 'Computer Accessories',
      Unit: 'PCS',
      SellingPrice: '799',
      PurchasePrice: '450',
      GSTRate: '18',
      OpeningStock: '50',
      LowStockThreshold: '10',
    },
    {
      Name: 'Mechanical Gaming Keyboard',
      SKU: 'ACC-KEY-RGB',
      HSN: '84716060',
      Category: 'Computer Accessories',
      Unit: 'PCS',
      SellingPrice: '2499',
      PurchasePrice: '1600',
      GSTRate: '18',
      OpeningStock: '20',
      LowStockThreshold: '5',
    },
  ];
  exportToCSV('products_import_template', sampleData);
}
