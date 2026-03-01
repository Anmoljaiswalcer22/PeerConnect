import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { LogOut, MessageSquare, Settings, UserRound, WifiOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/IconButton';
import { LogoMark } from '../components/brand/Logo';
import { cn } from '../utils/cn';

const NAV = [
  { to: '/chat', label: 'Chats', Icon: MessageSquare },
  { to: '/profile', label: 'Profile', Icon: UserRound },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

function NavRail() {
  const authUser = useAuthStore((s) => s.authUser);
  const logout = useAuthStore((s) => s.logout);
  const unreadTotal = useChatStore((s) => s.contacts.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0));

  return (
    <nav className="hidden w-16 shrink-0 flex-col items-center justify-between border-r border-line bg-base-100 py-4 md:flex" aria-label="Main">
      <div className="flex flex-col items-center gap-6">
        <LogoMark className="size-8" />
        <ul className="flex flex-col items-center gap-1.5">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to} className="tooltip tooltip-right" data-tip={label}>
              <NavLink
                to={to}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    'relative inline-flex size-10 items-center justify-center rounded-lg transition-colors duration-150',
                    isActive ? 'bg-primary-subtle text-primary' : 'text-fg-subtle hover:bg-surface-3 hover:text-fg',
                  )
                }
              >
                <Icon className="size-5" />
                {to === '/chat' && unreadTotal > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-base-100" aria-label={`${unreadTotal} unread`} />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-center gap-3">
        <IconButton label="Log out" tooltip tooltipSide="right" onClick={logout}>
          <LogOut className="size-[18px]" />
        </IconButton>
        <NavLink to="/profile" aria-label="Your profile" className="rounded-full">
          <Avatar user={authUser} size="sm" online ringClassName="border-base-100" />
        </NavLink>
      </div>
    </nav>
  );
}

function ConnectionBanner() {
  const status = useAuthStore((s) => s.socketStatus);
  if (status !== 'reconnecting') return null;
  return (
    <div role="status" className="flex shrink-0 items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-1.5 text-meta text-warning">
      <WifiOff className="size-3.5" aria-hidden="true" />
      Connection lost. Reconnecting… Messages you send are still saved.
    </div>
  );
}

/** Shell for logged-in pages: nav rail (desktop) + content. */
export function AppLayout() {
  const fetchContacts = useChatStore((s) => s.fetchContacts);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Total unread in the browser tab title
  const unreadTotal = useChatStore((s) => s.contacts.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0));
  useEffect(() => {
    document.title = unreadTotal > 0 ? `(${unreadTotal}) PeerConnect` : 'PeerConnect';
  }, [unreadTotal]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <ConnectionBanner />
        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
