import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, Loader2, MessageCircle } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from '../ui/EmptyState';
import { formatDayLabel, isSameDay } from '../../utils/format';

const NEAR_BOTTOM_PX = 120;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

function DateDivider({ date }) {
  return (
    <div className="my-4 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-line" />
      <span className="rounded-full border border-line bg-surface-1 px-2.5 py-0.5 font-mono text-[11px] text-fg-subtle">
        {formatDayLabel(date)}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * Scroll behaviour:
 *  - first load jumps to the newest message
 *  - new messages auto-scroll only if you're near the bottom or you sent them;
 *    otherwise a "New messages" button appears
 *  - loading older messages (scrolling up) keeps your reading position
 */
export function MessageList({ myId, peer }) {
  const messages = useChatStore((s) => s.messages);
  const hasMore = useChatStore((s) => s.hasMore);
  const isLoadingOlder = useChatStore((s) => s.isLoadingOlder);
  const loadOlder = useChatStore((s) => s.loadOlder);
  const retryMessage = useChatStore((s) => s.retryMessage);
  const discardMessage = useChatStore((s) => s.discardMessage);
  const isTyping = useChatStore((s) => Boolean(peer && s.typing[peer._id]));

  const scrollRef = useRef(null);
  const topSentinelRef = useRef(null);
  const nearBottomRef = useRef(true);
  const prevRef = useRef({ first: null, last: null, height: 0, count: 0 });
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJump(false);
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    nearBottomRef.current = near;
    if (near) setShowJump(false);
  };

  // Decide how to scroll after the list changes (before paint, to avoid jumps).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevRef.current;
    const first = messages[0]?.clientMessageId ?? messages[0]?._id ?? null;
    const lastMsg = messages[messages.length - 1];
    const last = lastMsg?.clientMessageId ?? lastMsg?._id ?? null;

    if (prev.count === 0 && messages.length > 0) {
      el.scrollTop = el.scrollHeight; // initial load
    } else if (prev.first && first !== prev.first && last === prev.last) {
      el.scrollTop += el.scrollHeight - prev.height; // older messages prepended
    } else if (last !== prev.last && lastMsg) {
      if (lastMsg.senderId === myId || nearBottomRef.current) scrollToBottom('smooth');
      else setShowJump(true);
    }

    prevRef.current = { first, last, height: el.scrollHeight, count: messages.length };
  }, [messages, myId, scrollToBottom]);

  // Keep the typing indicator visible if we're at the bottom.
  useEffect(() => {
    if (isTyping && nearBottomRef.current) scrollToBottom('smooth');
  }, [isTyping, scrollToBottom]);

  // Infinite scroll upward.
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          prevRef.current.height = scrollRef.current?.scrollHeight ?? 0;
          loadOlder();
        }
      },
      { root: scrollRef.current, rootMargin: '200px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadOlder]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain px-3 pt-4 pb-2 sm:px-6"
        role="log"
        aria-label={`Conversation with ${peer?.fullName ?? 'user'}`}
        aria-live="polite"
        aria-relevant="additions"
      >
        <div ref={topSentinelRef} aria-hidden="true" />
        {isLoadingOlder && (
          <div className="flex justify-center py-3" role="status">
            <Loader2 className="size-4 animate-spin text-fg-subtle" aria-label="Loading older messages" />
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <p className="py-4 text-center text-meta text-fg-subtle">This is the beginning of your conversation with {peer?.fullName}.</p>
        )}

        {messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title={`Start chatting with ${peer?.fullName ?? 'them'}`} className="h-full">
            Messages are saved, so they'll see it even if they're offline right now.
          </EmptyState>
        ) : (
          messages.map((message, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt);
            const groupedWithNext =
              next &&
              next.senderId === message.senderId &&
              isSameDay(next.createdAt, message.createdAt) &&
              new Date(next.createdAt) - new Date(message.createdAt) < GROUP_WINDOW_MS;
            return (
              <Fragment key={message.clientMessageId ?? message._id}>
                {newDay && <DateDivider date={message.createdAt} />}
                <MessageBubble
                  message={message}
                  isOwn={message.senderId === myId}
                  isLastInGroup={!groupedWithNext}
                  onRetry={retryMessage}
                  onDiscard={discardMessage}
                />
              </Fragment>
            );
          })
        )}

        {isTyping && <TypingIndicator name={peer?.fullName} />}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 animate-rise-in items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-meta font-medium text-fg shadow-pop hover:bg-surface-3"
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
          New messages
        </button>
      )}
    </div>
  );
}
