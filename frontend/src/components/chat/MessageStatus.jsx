import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

const LABELS = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
};

/** ✓ sent · ✓✓ delivered · ✓✓ (accent) read */
export function MessageStatus({ status, className }) {
  const Icon = { sending: Clock, sent: Check, delivered: CheckCheck, read: CheckCheck, failed: AlertCircle }[status] ?? Check;
  return (
    <span className={cn('inline-flex', className)} title={LABELS[status]}>
      <Icon
        className={cn(
          'size-3.5',
          status === 'read' && 'text-primary',
          status === 'failed' && 'text-error',
          status === 'sending' && 'size-3 opacity-70',
        )}
        aria-label={LABELS[status]}
      />
    </span>
  );
}
