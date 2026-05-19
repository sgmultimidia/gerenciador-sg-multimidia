import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = '', children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-blue-300 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
            {hint && <span className="text-xs text-slate-400 ml-2 font-normal">{hint}</span>}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-lg appearance-none cursor-pointer
              bg-gradient-to-br from-slate-700/80 to-slate-700/50 text-white
              border border-slate-600
              hover:border-blue-500/50 hover:from-slate-700 hover:to-slate-600/80
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              focus:from-slate-700 focus:to-slate-600
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-600
              transition-all duration-200
              shadow-sm hover:shadow-md focus:shadow-lg
              ${error ? 'border-red-500 focus:ring-red-500 hover:border-red-500' : ''}
              ${className}
            `}
            style={{
              colorScheme: 'dark'
            }}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className={`
            absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none
            transition-all duration-200
            ${error ? 'text-red-400' : 'text-slate-400 group-hover:text-blue-400 group-focus-within:text-blue-400'}
          `} />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
