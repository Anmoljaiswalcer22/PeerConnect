import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const SIZES = { sm: 'size-8', md: 'size-9', lg: 'size-10' };
// Full class names so Tailwind/daisyUI can detect them at build time.
const TOOLTIP_SIDES = { top: 'tooltip-top', bottom: 'tooltip-bottom', right: 'tooltip-right', left: 'tooltip-left' };

/** Square icon-only button. `label` is required for screen readers and the tooltip. */
export const IconButton = forwardRef(function IconButton(
  { label, size = 'md', active = false, className, children, type = 'button', tooltip = false, tooltipSide = 'bottom', ...props },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={tooltip ? undefined : label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        active ? 'bg-primary-subtle text-primary' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );

  if (!tooltip) return button;
  return (
    <div className={cn('tooltip', TOOLTIP_SIDES[tooltipSide])} data-tip={label}>
      {button}
    </div>
  );
});
