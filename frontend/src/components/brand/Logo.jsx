import { cn } from '../../utils/cn';

/** Brand mark: a speech bubble in the accent colour with a presence dot. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-surface-1" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" className="stroke-line" />
      <path
        d="M9 10.5A3.5 3.5 0 0 1 12.5 7h7A3.5 3.5 0 0 1 23 10.5v4a3.5 3.5 0 0 1-3.5 3.5H15l-4 3.5V18A3.5 3.5 0 0 1 9 14.5z"
        className="fill-primary"
      />
      <circle cx="21.5" cy="21.5" r="3.5" className="fill-success stroke-surface-1" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ className, markClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="text-[15px] font-semibold tracking-tight text-fg">PeerConnect</span>
    </span>
  );
}
