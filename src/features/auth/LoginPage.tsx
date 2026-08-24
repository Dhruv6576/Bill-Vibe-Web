import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, isLoading } = useAuth();
  const { isDark, setTheme, theme } = useTheme();
  const { showToast } = useNotification();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme(isDark ? 'light' : 'dark');
  };

  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      showToast({ type: 'success', title: 'Welcome back!', message: 'Signed in successfully.' });
      navigate('/dashboard');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Login Failed', message: err.message || 'Could not sign in.' });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await signInWithEmail(email.trim());
      setIsEmailSent(true);
      showToast({ type: 'success', title: 'Authenticated', message: 'Logged in successfully.' });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Sign In Failed', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      {/* Subtle Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-100/70 dark:bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-4">
          <Zap className="w-6 h-6 fill-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight">
          Welcome to BillVibe
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Smart GST Invoicing & Accounting for Indian Businesses
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          {/* Google Sign In CTA */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider relative">
              or email
            </span>
          </div>

          {/* Email magic link / login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="owner@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In with Email
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
