import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const baseStyles = 'rounded-xl border p-5 transition-all duration-150';

  const variants = {
    default: 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--fg-color)]',
    glass: 'bg-[var(--glass-card-bg)] border-[var(--glass-border-color)] text-[var(--fg-color)]',
    interactive:
      'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--fg-color)] hover:border-[var(--glass-border-color)] hover:bg-[var(--glass-card-bg)] cursor-pointer',
  };

  return (
    <div className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge(clsx('flex flex-col space-y-1.5 mb-4', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={twMerge(clsx('text-lg font-semibold tracking-tight text-[var(--fg-color)]', className))}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={twMerge(clsx('text-sm text-[var(--muted-fg)]', className))} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => <div className={twMerge(clsx('', className))} {...props}>{children}</div>;
