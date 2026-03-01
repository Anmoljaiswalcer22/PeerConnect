import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { RefreshCw, Search, Settings, UserRound, Users, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { ContactItem } from './ContactItem';
import { ContactSkeleton } from './Skeletons';
import { EmptyState } from '../ui/EmptyState';
import { IconButton } from '../ui/IconButton';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { LogoMark } from '../brand/Logo';

export function Sidebar() {
  const authUser = useAuthStore((s) => s.authUser);
  const onlineUserIds = useAuthStore((s) => s.onlineUserIds);
  const contacts = useChatStore((s) => s.contacts);
  const isLoading = useChatStore((s) => s.isContactsLoading);
  const error = useChatStore((s) => s.contactsError);
  const fetchContacts = useChatStore((s) => s.fetchContacts);

  const [query, setQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const onlineCount = useMemo(
    () => contacts.filter((c) => onlineUserIds.includes(c._id)).length,
    [contacts, onlineUserIds],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter(
      (c) => (!onlineOnly || onlineUserIds.includes(c._id)) && (!q || c.fullName.toLowerCase().includes(q)),
    );
  }, [contacts, onlineUserIds, onlineOnly, query]);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-surface-1" aria-label="Conversations">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-7 md:hidden" />
          <h1 className="text-base font-semibold tracking-tight">Chats</h1>
        </div>
        {/* On mobile the nav rail is hidden, so profile/settings live here */}
        <div className="flex items-center gap-1 md:hidden">
          <Link to="/settings" aria-label="Settings" className="inline-flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg">
            <Settings className="size-[18px]" />
          </Link>
          <Link to="/profile" aria-label="Your profile" className="ml-1 rounded-full">
            <Avatar user={authUser} size="sm" />
          </Link>
        </div>
      </div>

      {/* Search + filter */}
      <div className="shrink-0 space-y-3 px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            aria-label="Search people"
            className="h-9 w-full rounded-lg border border-line bg-surface-2 pr-8 pl-9 text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary-subtle focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <IconButton label="Clear search" size="sm" className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2" onClick={() => setQuery('')}>
              <X className="size-3.5" />
            </IconButton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Toggle checked={onlineOnly} onChange={setOnlineOnly} label="Show online only" />
          <span className="font-mono text-[11px] text-fg-subtle">{onlineCount} online</span>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        {isLoading && contacts.length === 0 ? (
          <ContactSkeleton />
        ) : error ? (
          <EmptyState
            icon={RefreshCw}
            title="Couldn't load conversations"
            action={
              <Button size="sm" variant="secondary" onClick={() => fetchContacts()}>
                Try again
              </Button>
            }
          >
            {error}
          </EmptyState>
        ) : contacts.length === 0 ? (
          <EmptyState icon={Users} title="No one here yet">
            Invite a friend to sign up. They'll appear here instantly.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={onlineOnly ? UserRound : Search} title={onlineOnly ? 'Nobody is online' : 'No matches'}>
            {onlineOnly ? 'Turn off “Show online only” to see everyone.' : `No one called “${query}”.`}
          </EmptyState>
        ) : (
          <ul className="space-y-0.5 px-2">
            {visible.map((contact) => (
              <ContactItem key={contact._id} contact={contact} myId={authUser?._id} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
