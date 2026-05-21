import type { ButtonHTMLAttributes } from 'react';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'default' | 'danger' | 'amber';
}

export function RetroButton({ active, variant = 'default', className = '', children, ...props }: RetroButtonProps) {
  const variantClass = variant === 'danger' ? 'danger' : variant === 'amber' ? '!border-amber !text-amber hover:shadow-amber' : '';
  return (
    <button
      className={`retro-btn ${active ? 'active' : ''} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
