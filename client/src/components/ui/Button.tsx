import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-[9px] transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-[var(--fg-color)] text-[var(--bg-color)] hover:opacity-90 active:scale-[0.98]',
    secondary:
      'bg-[var(--secondary-bg)] text-[var(--fg-color)] border border-[var(--border-color)] hover:bg-[var(--glass-card-bg)] active:scale-[0.98]',
    outline:
      'bg-transparent text-[var(--fg-color)] border border-[var(--glass-border-color)] hover:bg-[var(--secondary-bg)] active:scale-[0.98]',
    destructive:
      'bg-[var(--destructive-color)] text-white hover:opacity-90 active:scale-[0.98]',
    ghost:
      'bg-transparent text-[var(--muted-fg)] hover:text-[var(--fg-color)] hover:bg-[var(--secondary-bg)]',
    brand:
      'bg-[var(--primary-color)] text-white hover:opacity-90 active:scale-[0.98] font-semibold',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ms-1 me-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};
