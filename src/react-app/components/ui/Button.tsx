import { ReactNode } from 'react';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
}

const sizeClasses = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50',
  secondary: 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg hover:shadow-slate-500/50',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/50',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50',
  warning: 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-orange-500/50',
  ghost: 'bg-slate-700/30 hover:bg-slate-700/50 text-white border border-slate-600 hover:border-slate-500',
};

export default function Button({
  children,
  onClick,
  disabled = false,
  type = 'button',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  icon,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        rounded-lg font-semibold transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
}
