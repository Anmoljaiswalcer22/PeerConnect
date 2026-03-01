import { cn } from '../../utils/cn';

const Bar = ({ className }) => <div className={cn('skeleton rounded-md bg-surface-3', className)} />;

export function ContactSkeleton({ count = 7 }) {
  return (
    <ul className="space-y-1 px-2" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
          <div className="skeleton size-10 shrink-0 rounded-full bg-surface-3" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bar className="h-3 w-2/5" />
            <Bar className="h-3 w-4/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const MESSAGE_SHAPES = [
  { own: false, width: 'w-48' },
  { own: false, width: 'w-64' },
  { own: true, width: 'w-40' },
  { own: false, width: 'w-56' },
  { own: true, width: 'w-72' },
  { own: true, width: 'w-32' },
];

export function MessageSkeleton() {
  return (
    <div className="space-y-3 px-4 py-6 sm:px-6" aria-hidden="true">
      {MESSAGE_SHAPES.map((shape, i) => (
        <div key={i} className={cn('flex', shape.own ? 'justify-end' : 'justify-start')}>
          <div className={cn('skeleton h-10 max-w-[70%] rounded-bubble bg-surface-3', shape.width)} />
        </div>
      ))}
    </div>
  );
}
