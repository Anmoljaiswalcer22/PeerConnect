import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { useIsOnline } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { formatLastSeen } from '../../utils/format';
import { cn } from '../../utils/cn';

/** Re-render every 30 s so "last seen 3 min ago" stays accurate. */
function useTicker(ms = 30_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function ChatHeader({ peer }) {
  const navigate = useNavigate();
  const online = useIsOnline(peer?._id);
  const isTyping = useChatStore((s) => Boolean(peer && s.typing[peer._id]));
  useTicker();

  const status = isTyping ? 'typing…' : online ? 'Online' : formatLastSeen(peer?.lastSeen);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface-1/80 px-3 backdrop-blur sm:px-4">
      <IconButton label="Back to conversations" className="md:hidden" onClick={() => navigate('/chat')}>
        <ArrowLeft className="size-5" />
      </IconButton>

      {peer ? (
        <>
          <Avatar user={peer} online={online} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{peer.fullName}</h2>
            <p
              aria-live="polite"
              className={cn('truncate text-meta', isTyping ? 'text-primary' : online ? 'text-success' : 'text-fg-subtle')}
            >
              {status}
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center gap-3" aria-hidden="true">
          <div className="skeleton size-10 rounded-full bg-surface-3" />
          <div className="skeleton h-3 w-32 rounded bg-surface-3" />
        </div>
      )}

      <IconButton label="Close conversation (Esc)" className="hidden md:inline-flex" onClick={() => navigate('/chat')}>
        <X className="size-[18px]" />
      </IconButton>
    </header>
  );
}
