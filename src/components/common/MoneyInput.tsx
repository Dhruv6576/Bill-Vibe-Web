import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  currencySymbol?: string;
  value?: number | string;
  onChange?: (val: number) => void;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, label, error, helperText, currencySymbol = '₹', value, onChange, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawVal = e.target.value.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(rawVal);
      if (onChange) {
        onChange(isNaN(parsed) ? 0 : parsed);
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-sm">
            {currencySymbol}
          </div>
          <input
            id={inputId}
            ref={ref}
            type="number"
            step="0.01"
            value={value !== undefined ? value : ''}
            onChange={handleChange}
            className={twMerge(
              clsx(
                'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-8 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors font-mono',
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

MoneyInput.displayName = 'MoneyInput';
