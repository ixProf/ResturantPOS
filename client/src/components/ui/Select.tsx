import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[var(--muted-fg)]">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2 text-sm bg-[var(--card-bg)] text-[var(--fg-color)] border border-[var(--border-color)] rounded-[9px]',
              'focus:outline-none focus:border-[var(--primary-color)] transition-colors duration-150 cursor-pointer',
              error && 'border-[var(--destructive-color)]',
              className
            )
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--card-bg)] text-[var(--fg-color)]">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-[var(--destructive-color)]">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
