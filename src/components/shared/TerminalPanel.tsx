import type { ReactNode } from 'react';

interface TerminalPanelProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  width?: string;
}

export function TerminalPanel({ title, children, onClose, className = '', width = 'w-80' }: TerminalPanelProps) {
  return (
    <div className={`flex flex-col crt-border bg-terminal h-full ${width} ${className}`}>
      <div className="panel-header flex items-center justify-between shrink-0">
        <span>{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-phosphor-dim hover:text-phosphor ml-4 leading-none"
            aria-label="Close panel"
          >
            [X]
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
