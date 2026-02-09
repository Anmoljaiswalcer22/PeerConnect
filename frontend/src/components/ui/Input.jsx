import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Labelled text input with optional leading icon, trailing slot and error.
 * The error is linked with aria-describedby so screen readers announce it.
 */
export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, trailing, className, inputClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-meta font-medium text-fg-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-lg border bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-subtle',
            'transition-[border-color,box-shadow] duration-150',
            'focus:outline-none focus-visible:outline-none focus:ring-2',
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-line hover:border-line-strong focus:border-primary focus:ring-primary-subtle',
            Icon && 'pl-9',
            trailing && 'pr-10',
            inputClassName,
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-meta text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-meta text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
