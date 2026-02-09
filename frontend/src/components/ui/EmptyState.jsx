import { cn } from '../../utils/cn';

export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {children && <div className="mt-1.5 max-w-xs text-meta text-fg-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
