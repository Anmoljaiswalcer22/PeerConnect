import { useAuthStore } from '../../stores/authStore';
import { firstName } from '../../utils/format';

function Kbd({ children }) {
  return (
    <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">{children}</kbd>
  );
}

/** Desktop placeholder when no conversation is open. */
export function NoChatSelected() {
  const authUser = useAuthStore((s) => s.authUser);
  const onlineCount = useAuthStore((s) => Math.max(0, s.onlineUserIds.filter((id) => id !== s.authUser?._id).length));

  return (
    <div className="flex h-full flex-col items-center justify-center bg-base-100 px-8 text-center">
      {/* Abstract illustration: two bubbles in conversation */}
      <svg viewBox="0 0 160 120" className="mb-8 w-40 animate-rise-in" aria-hidden="true">
        <rect x="8" y="14" width="96" height="40" rx="14" className="fill-surface-2" />
        <rect x="22" y="28" width="52" height="5" rx="2.5" className="fill-line-strong" />
        <rect x="22" y="38" width="34" height="5" rx="2.5" className="fill-line-strong" />
        <rect x="56" y="66" width="96" height="40" rx="14" className="fill-primary-subtle stroke-primary" strokeOpacity="0.35" />
        <rect x="70" y="80" width="60" height="5" rx="2.5" className="fill-primary" fillOpacity="0.55" />
        <rect x="70" y="90" width="38" height="5" rx="2.5" className="fill-primary" fillOpacity="0.35" />
        <circle cx="148" cy="20" r="6" className="fill-success" />
      </svg>

      <h2 className="text-xl font-semibold tracking-tight">
        {authUser ? `Hi ${firstName(authUser.fullName)}, pick a conversation` : 'Pick a conversation'}
      </h2>
      <p className="mt-2 max-w-sm text-fg-muted">
        Choose someone from the list to start chatting. Messages arrive instantly, with typing indicators and read receipts.
      </p>
      <p className="mt-4 inline-flex items-center gap-2 text-meta text-fg-subtle">
        <span className="size-2 rounded-full bg-success" aria-hidden="true" />
        {onlineCount === 0 ? 'Nobody else is online right now' : `${onlineCount} ${onlineCount === 1 ? 'person' : 'people'} online`}
      </p>

      <dl className="mt-10 grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-2 text-left text-meta text-fg-subtle">
        <dt className="text-right">
          <Kbd>Enter</Kbd>
        </dt>
        <dd>Send message</dd>
        <dt className="text-right">
          <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd>
        </dt>
        <dd>New line</dd>
        <dt className="text-right">
          <Kbd>Esc</Kbd>
        </dt>
        <dd>Close conversation</dd>
      </dl>
    </div>
  );
}
