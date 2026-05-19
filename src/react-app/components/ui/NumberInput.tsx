import { InputHTMLAttributes, forwardRef } from 'react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, hint, prefix, suffix, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-blue-300 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
            {hint && <span className="text-xs text-slate-400 ml-2 font-normal">{hint}</span>}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            type="number"
            className={`
              w-full px-4 py-3 rounded-lg
              bg-slate-700/50 text-white placeholder-slate-400
              border border-slate-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
              ${prefix ? 'pl-10' : ''}
              ${suffix ? 'pr-12' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
