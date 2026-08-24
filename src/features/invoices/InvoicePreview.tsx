import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { QrCode, Printer, Download, Share2 } from 'lucide-react';
import { Invoice, Business } from '../../types';
import { ModernTemplate } from '../templates/ModernTemplate';
import { Button } from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { generateUPIPaymentString } from '../../utils/upiHelper';
import { formatINR } from '../../utils/currency';

export interface InvoicePreviewProps {
  invoice: Invoice;
  business: Business;
  onShareWhatsApp?: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  business,
  onShareWhatsApp,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useNotification();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);

    try {
      showToast({ type: 'info', title: 'Generating PDF...', message: 'Rendering vector A4 layout.' });

      // 1. Generate high-resolution PNG snapshot strictly of the 794px A4 sheet
      const imgData = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // 2. Compute exact A4 dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Embed universal HTTPS clickable link over the QR code area
      if (business.upi_id) {
        const upiUrl = generateUPIPaymentString({
          upiId: business.upi_id,
          payeeName: business.name,
          amount: invoice.balance_due,
          transactionNote: `Bill ${invoice.invoice_number}`,
        });

        const qrContainer = previewRef.current.querySelector('a[title*="UPI"]') || previewRef.current.querySelector('img[alt="UPI Payment QR"]');
        if (qrContainer) {
          const containerRect = previewRef.current.getBoundingClientRect();
          const qrRect = qrContainer.getBoundingClientRect();
          const xMm = Math.max(0, ((qrRect.left - containerRect.left) / containerRect.width) * pdfWidth - 1);
          const yMm = Math.max(0, ((qrRect.top - containerRect.top) / containerRect.height) * pdfHeight - 1);
          const wMm = (qrRect.width / containerRect.width) * pdfWidth + 2;
          const hMm = (qrRect.height / containerRect.height) * pdfHeight + 2;

          pdf.link(xMm, yMm, wMm, hMm, { url: upiUrl });
        }
      }

      // Clean filename and guarantee .pdf extension
      const rawNum = invoice.invoice_number || 'Invoice';
      const cleanNum = rawNum.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const fileName = `${cleanNum}.pdf`;

      // Create explicit application/pdf Blob URL for native Windows/Chrome/Edge download
      const blob = pdf.output('blob');
      const fileBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(fileBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.setAttribute('download', fileName);
      downloadLink.dataset.downloadurl = ['application/pdf', fileName, blobUrl].join(':');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

      showToast({
        type: 'success',
        title: 'PDF Downloaded',
        message: `${fileName} saved to your device.`,
      });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast({
        type: 'info',
        title: 'Opening Print System',
        message: 'Use "Save as PDF" destination to download your bill.',
      });
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWithPDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);

    try {
      showToast({ type: 'info', title: 'Preparing PDF for WhatsApp...', message: 'Optimizing PDF attachment.' });

      // Generate optimized PNG snapshot
      const imgData = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      if (business.upi_id) {
        const upiUrl = generateUPIPaymentString({
          upiId: business.upi_id,
          payeeName: business.name,
          amount: invoice.balance_due,
          transactionNote: `Bill ${invoice.invoice_number}`,
        });

        const qrContainer = previewRef.current.querySelector('a[title*="UPI"]') || previewRef.current.querySelector('img[alt="UPI Payment QR"]');
        if (qrContainer) {
          const containerRect = previewRef.current.getBoundingClientRect();
          const qrRect = qrContainer.getBoundingClientRect();
          const xMm = Math.max(0, ((qrRect.left - containerRect.left) / containerRect.width) * pdfWidth - 1);
          const yMm = Math.max(0, ((qrRect.top - containerRect.top) / containerRect.height) * pdfHeight - 1);
          const wMm = (qrRect.width / containerRect.width) * pdfWidth + 2;
          const hMm = (qrRect.height / containerRect.height) * pdfHeight + 2;

          pdf.link(xMm, yMm, wMm, hMm, { url: upiUrl });
        }
      }

      const rawNum = invoice.invoice_number || 'Invoice';
      const cleanNum = rawNum.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const fileName = `${cleanNum}.pdf`;

      const blob = pdf.output('blob');
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // Build structured WhatsApp message
      const shareText = `Hello ${invoice.party_name},\n\nYour invoice *${invoice.invoice_number}* for *${formatINR(invoice.grand_total)}* from *${business.name}* is generated.\n\n*Balance Due:* ${formatINR(invoice.balance_due)}\n*Due Date:* ${invoice.due_date}\n\nThank you for your business!`;

      // 1. Mobile Web Share API: Native file sharing
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Invoice ${invoice.invoice_number}`,
          text: shareText,
        });
        showToast({ type: 'success', title: 'Shared Successfully', message: 'Invoice PDF shared.' });
        return;
      }

      // 2. Desktop Browser: Download PDF + open WhatsApp chat
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

      const cleanPhone = (invoice.party_phone || '').replace(/[^0-9]/g, '');
      const encodedText = encodeURIComponent(shareText);
      const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

      showToast({
        type: 'success',
        title: 'PDF Downloaded & WhatsApp Ready',
        message: 'Opening WhatsApp. Attach the downloaded PDF in chat.',
      });

      window.open(waUrl, '_blank');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Share error:', err);
        showToast({ type: 'error', title: 'Share Failed', message: 'Could not complete sharing.' });
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Live A4 Invoice Preview
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {business.upi_id && invoice.balance_due > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
              onClick={() => {
                const upi = generateUPIPaymentString({
                  upiId: business.upi_id || '',
                  payeeName: business.name,
                  amount: invoice.balance_due,
                  transactionNote: `Bill ${invoice.invoice_number}`,
                });
                if (upi) {
                  window.location.href = upi;
                }
              }}
              leftIcon={<QrCode className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Pay via UPI
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onShareWhatsApp || handleShareWithPDF}
            isLoading={isGeneratingPDF}
            leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Share PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            isLoading={isGeneratingPDF}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="invoice-print-container bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-4 rounded-2xl overflow-x-auto w-full max-w-full flex justify-center">
        <div
          ref={previewRef}
          id="invoice-printable-area"
          className="bg-white shadow-sm print:shadow-none box-border shrink-0"
          style={{ width: '794px', minWidth: '794px' }}
        >
          <ModernTemplate invoice={invoice} business={business} />
        </div>
      </div>
    </div>
  );
};
