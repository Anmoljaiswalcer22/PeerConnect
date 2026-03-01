import { memo } from 'react';
import { NavLink } from 'react-router';
import { Avatar } from '../ui/Avatar';
import { MessageStatus } from './MessageStatus';
import { useIsOnline } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { formatContactTime } from '../../utils/format';
import { cn } from '../../utils/cn';

function previewText(message, isOwn) {
  if (!message) return null;
  const body =
    message.type === 'image'
      ? `📷 ${message.text || 'Photo'}`
      : message.type === 'file'
        ? `📎 ${message.attachment?.name ?? 'File'}`
        : message.text;
  return isOwn ? `You: ${body}` : body;
}

export const ContactItem = memo(function ContactItem({ contact, myId }) {
  const online = useIsOnline(contact._id);
  const isTyping = useChatStore((s) => Boolean(s.typing[contact._id]));
  const last = contact.lastMessage;
  const isOwn = last?.senderId === myId;
  const unread = contact.unreadCount ?? 0;

  return (
    <li>
      <NavLink
        to={`/chat/${contact._id}`}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150',
            isActive ? 'bg-surface-3' : 'hover:bg-surface-2',
          )
        }
      >
        <Avatar user={contact} online={online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate', unread ? 'font-semibold text-fg' : 'font-medium text-fg')}>{contact.fullName}</span>
            {last && (
              <time
                dateTime={last.createdAt}
                className={cn('shrink-0 font-mono text-[11px]', unread ? 'text-primary' : 'text-fg-subtle')}
              >
                {formatContactTime(last.createdAt)}
              </time>
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            {isTyping ? (
              <span className="truncate text-meta text-primary">typing…</span>
            ) : (
              <span className={cn('flex min-w-0 items-center gap-1 text-meta', unread ? 'text-fg' : 'text-fg-subtle')}>
                {isOwn && last && <MessageStatus status={last.status} className="shrink-0" />}
                <span className="truncate">{previewText(last, isOwn) ?? (online ? 'Online' : 'Say hello 👋')}</span>
              </span>
            )}
            {unread > 0 && (
              <span
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-content"
                aria-label={`${unread} unread`}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </NavLink>
    </li>
  );
});
