import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, helperText, value = '', onChange, id, onFocus, onBlur, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!value || value.trim() === '') {
        onChange('+91 ');
      }
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // If user only left "+91" or "+91 ", clear it out so it doesn't save an empty prefix
      if (value === '+91' || value === '+91 ' || value.trim() === '+91') {
        onChange('');
      }
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // If user completely clears the input
      if (!raw || raw.trim() === '') {
        onChange('');
        return;
      }

      // Extract all digits from raw input
      let digits = raw.replace(/\D/g, '');

      // If starts with 91 (country code) and has more digits, strip leading 91
      if (digits.startsWith('91')) {
        digits = digits.slice(2);
      }

      // Max 10 digits allowed
      digits = digits.slice(0, 10);

      if (digits.length === 0) {
        onChange('+91 ');
        return;
      }

      if (digits.length <= 5) {
        onChange(`+91 ${digits}`);
      } else {
        onChange(`+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-xs">
          <input
            id={inputId}
            ref={ref}
            type="tel"
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            maxLength={16}
            className={twMerge(
              clsx(
                'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors font-mono tracking-wide',
                error && 'border-rose-500 focus:ring-rose-500 dark:border-rose-500',
                props.disabled && 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
