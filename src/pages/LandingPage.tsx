import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  QrCode,
  Layers,
  Sparkles,
  BarChart3,
  Smartphone,
  ChevronDown,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { calculateInvoiceTotals } from '../utils/gstEngine';
import { formatINR } from '../utils/currency';
import { numberToWordsINR } from '../utils/numberToWords';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, setTheme, theme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme(isDark ? 'light' : 'dark');
  };

  // Interactive Live Calculator demo state
  const [calcQty, setCalcQty] = useState(2);
  const [calcRate, setCalcRate] = useState(24999);
  const [calcGst, setCalcGst] = useState(18);
  const [calcInterstate, setCalcInterstate] = useState(false);
  const [calcDiscount, setCalcDiscount] = useState(5);

  const sampleItems = [
    {
      name: 'Sony 4K Smart Android TV',
      quantity: calcQty,
      unit: 'PCS',
      rate: calcRate,
      discount_percent: calcDiscount,
      taxable_amount: 0,
      gst_rate: calcGst,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
      total: 0,
    },
  ];

  const calcResult = calculateInvoiceTotals(
    sampleItems,
    'percentage',
    0,
    0,
    0,
    calcInterstate
  );

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is there any artificial limit on generating invoices?',
      a: 'No. You can create as many invoices, quotations, and purchase bills as your business needs without restrictions.',
    },
    {
      q: 'How does the automatic Indian GST calculation work?',
      a: 'BillVibe compares your Business GST State with the Customer Place of Supply. Same state transactions are automatically divided into 50% CGST and 50% SGST (or UTGST). Inter-state supplies automatically calculate IGST.',
    },
    {
      q: 'Can I add UPI QR codes and Bank Details to my invoices?',
      a: 'Yes! Simply configure your UPI ID and Bank Account in settings. BillVibe dynamically embeds an NPCI-compliant payment QR code onto all generated PDFs and print layouts.',
    },
    {
      q: 'Does it support managing multiple shops or companies?',
      a: 'Yes. You can create multiple independent businesses under one account with complete Row Level Security (RLS) data isolation.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">BillVibe</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
          <a href="#calculator" className="hover:text-slate-900 dark:hover:text-white transition-colors">GST Engine</a>
          <a href="#templates" className="hover:text-slate-900 dark:hover:text-white transition-colors">Templates</a>
          <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate('/login')}>
            Start Free Trial
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-100/60 dark:bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Modern Indian SMBs, Traders & Service Providers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-slate-900 dark:text-slate-100 text-balance leading-tight">
            GST Invoicing & Billing <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
              engineered for pure speed.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-balance">
            Create professional GST tax invoices, collect payments with dynamic UPI QR codes, track customer ledgers, and manage inventory without monthly limits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore Live Demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Test GST Calculator
            </Button>
          </div>

          {/* Value Props Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Zero Invoice Limits</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Generate unlimited invoices & quotes</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 mb-2" />
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Dynamic UPI QR</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Instant payments via GPay, PhonePe</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mb-2" />
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Intra / Inter GST</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Auto CGST+SGST vs IGST split</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mb-2" />
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Multi-Business Ready</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage multiple shops with isolated data</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive GST Calculator Engine Section */}
      <section id="calculator" className="py-20 px-6 lg:px-12 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
              Interactive Indian GST Engine
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Test how BillVibe computes precise Intra-State (CGST + SGST) vs Inter-State (IGST) tax with round-off and amount in words.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Controls */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Invoice Simulation Controls
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Unit Selling Price:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(calcRate)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{calcQty} Units</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Trade Discount:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{calcDiscount}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={calcDiscount}
                  onChange={(e) => setCalcDiscount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 block">GST Tax Slab:</span>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setCalcGst(rate)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        calcGst === rate
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcInterstate}
                    onChange={(e) => setCalcInterstate(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Inter-State Transaction (Apply IGST instead of CGST + SGST)</span>
                </label>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Live Calculation
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">Tax Calculation Breakdown</h4>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {calcInterstate ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gross Value:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{formatINR(calcQty * calcRate)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Discount ({calcDiscount}%):</span>
                  <span className="font-mono text-rose-500">-{formatINR(calcResult.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-slate-100 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Taxable Value:</span>
                  <span className="font-mono">{formatINR(calcResult.taxableAmount)}</span>
                </div>

                {!calcInterstate ? (
                  <>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>CGST ({calcGst / 2}%):</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{formatINR(calcResult.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>SGST / UTGST ({calcGst / 2}%):</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{formatINR(calcResult.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>IGST ({calcGst}%):</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{formatINR(calcResult.igstAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Round-off:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{calcResult.roundOff >= 0 ? `+${calcResult.roundOff}` : calcResult.roundOff}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Grand Total (INR):</span>
                <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {formatINR(calcResult.grandTotal)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Amount in Words
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{numberToWordsINR(calcResult.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
              Full Suite for Fast-Growing Indian Enterprises
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Everything you need to run your trading, distribution, retail, or service operations with complete accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Split-Screen Invoicing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Edit items and taxes on the left while watching the pixel-perfect A4 vector printable invoice update live on the right.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">UPI Payment QR</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Customers can scan the dynamic UPI QR code on the invoice with Google Pay, PhonePe, or Paytm to pay directly to your bank account.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">GSTR-1 Tax Summary</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                One-click GSTR-1 summaries categorized by B2B, B2CS, and HSN codes, exportable directly to Excel for hassle-free CA filings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-6 lg:px-12 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-slate-100">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear answers to common questions about BillVibe
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">BillVibe</span>
            <span className="text-slate-400 ml-2">© 2026 BillVibe Technologies. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => navigate('/onboarding')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Start Free
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
