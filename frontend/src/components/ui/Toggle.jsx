import { useId } from 'react';
import { cn } from '../../utils/cn';

/** Accessible switch built on daisyUI's toggle. */
export function Toggle({ checked, onChange, label, className }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-2 select-none', className)}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="toggle toggle-xs toggle-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-meta text-fg-muted">{label}</span>
    </label>
  );
}
