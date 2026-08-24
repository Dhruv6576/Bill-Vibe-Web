import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, QrCode, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';
import { generateQRCodeDataUrl, generateUPIPaymentString } from '../utils/upiHelper';
import { formatINR } from '../utils/currency';

export const PublicPaymentPage: React.FC = () => {
  const [params] = useSearchParams();
  const upiId = params.get('pa') || '';
  const payeeName = params.get('pn') || 'Merchant';
  const rawAmount = parseFloat(params.get('am') || '0');
  const note = params.get('tn') || 'Invoice Payment';

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const upiUri = generateUPIPaymentString({
    upiId,
    payeeName,
    amount: rawAmount > 0 ? rawAmount : undefined,
    transactionNote: note,
  });

  useEffect(() => {
    // Generate high-resolution QR
    if (upiUri) {
      generateQRCodeDataUrl(upiUri).then((url) => setQrCodeUrl(url));
    }

    // Auto-launch UPI Intent on mobile devices
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && upiUri) {
      const timer = setTimeout(() => {
        window.location.href = upiUri;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [upiUri]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenApp = (schemePrefix?: string) => {
    if (!upiUri) return;
    if (schemePrefix) {
      // E.g. phonepe://pay or gpay://upi/pay
      const customUri = upiUri.replace('upi://', schemePrefix);
      window.location.href = customUri;
    } else {
      window.location.href = upiUri;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-1 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NPCI Verified UPI Payment</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">{payeeName}</h1>
          {note && <p className="text-xs text-slate-400">{note}</p>}
        </div>

        {/* Amount Box */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Amount Due</p>
          <p className="text-3xl font-black text-white tracking-tight mt-1">
            {rawAmount > 0 ? formatINR(rawAmount) : 'Custom Amount'}
          </p>
        </div>

        {/* Mobile 1-Tap UPI Apps */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-slate-400 text-center">Tap to Pay via Mobile App</p>
          <button
            onClick={() => handleOpenApp()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Pay with Any UPI App (GPay / PhonePe / Paytm)</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
          <div className="flex justify-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-44 h-44 rounded-xl bg-white p-2 border border-slate-700 shadow-inner"
              />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-slate-900 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-slate-600 animate-pulse" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Scan with Google Pay, PhonePe, Paytm, or BHIM</p>

          {/* Copy UPI ID */}
          {upiId && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div className="text-left overflow-hidden">
                <p className="text-[10px] text-slate-500 font-medium">UPI ID</p>
                <p className="text-xs font-mono font-bold text-indigo-400 truncate">{upiId}</p>
              </div>
              <button
                onClick={handleCopyUpi}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">
            Powered by <span className="font-semibold text-slate-400">BillVibe Invoicing</span>
          </p>
        </div>
      </div>
    </div>
  );
};
