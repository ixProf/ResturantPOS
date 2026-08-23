import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeStatusType =
  | 'Available'
  | 'Occupied'
  | 'Reserved'
  | 'Cleaning'
  | 'OutOfService'
  | 'Draft'
  | 'Submitted'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'PaymentPending'
  | 'Completed'
  | 'Cancelled'
  | 'Voided'
  | 'lowStock'
  | 'normal';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatusType;
  variant?: 'default' | 'outline' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status = 'default',
  variant = 'subtle',
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors';

  const statusStyles: Record<string, string> = {
    Available: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
    Occupied: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
    Reserved: 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/40',
    Cleaning: 'bg-blue-950/40 text-blue-300 border border-blue-800/40',
    OutOfService: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    
    Draft: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    Submitted: 'bg-sky-950/40 text-sky-300 border border-sky-800/40',
    Preparing: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
    Ready: 'bg-purple-950/40 text-purple-300 border border-purple-800/40',
    Served: 'bg-teal-950/40 text-teal-300 border border-teal-800/40',
    PaymentPending: 'bg-orange-950/40 text-orange-300 border border-orange-800/40',
    Completed: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
    Cancelled: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',
    Voided: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',

    lowStock: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',
    normal: 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/60',
    default: 'bg-[var(--secondary-bg)] text-[var(--fg-color)] border border-[var(--border-color)]',
  };

  const styleClass = statusStyles[status] || statusStyles.default;

  return (
    <span className={twMerge(clsx(baseStyles, styleClass, className))} {...props}>
      {children}
    </span>
  );
};
