import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[var(--muted-fg)]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2 text-sm bg-[var(--card-bg)] text-[var(--fg-color)] border border-[var(--border-color)] rounded-[9px]',
              'placeholder:text-[var(--muted-fg)]/60 focus:outline-none focus:border-[var(--primary-color)] transition-colors duration-150',
              error && 'border-[var(--destructive-color)]',
              className
            )
          )}
          {...props}
        />
        {error && <span className="text-xs text-[var(--destructive-color)]">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
