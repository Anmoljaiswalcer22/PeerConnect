import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useChatStore } from '../stores/chatStore';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { Sidebar } from '../components/chat/Sidebar';
import { Conversation } from '../components/chat/Conversation';
import { NoChatSelected } from '../components/chat/NoChatSelected';
import { cn } from '../utils/cn';

/**
 * /chat          → contact list (+ placeholder on desktop)
 * /chat/:userId  → conversation (+ contact list on desktop)
 * On mobile the URL decides which panel is shown, so the phone's back button
 * returns to the list and refreshing a conversation URL works.
 */
export default function ChatPage() {
  const { userId = null } = useParams();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const selectUser = useChatStore((s) => s.selectUser);
  const markConversationRead = useChatStore((s) => s.markConversationRead);

  useEffect(() => {
    selectUser(userId);
  }, [userId, selectUser]);

  // Leaving the page closes the conversation so new messages count as unread.
  useEffect(() => () => selectUser(null), [selectUser]);

  // Coming back to the tab marks the open conversation as read.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && userId) markConversationRead(userId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId, markConversationRead]);

  // Esc closes the conversation.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && userId && !e.defaultPrevented) navigate('/chat');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userId, navigate]);

  const showList = isDesktop || !userId;
  const showChat = isDesktop || Boolean(userId);

  return (
    <div className="flex h-full min-h-0">
      {showList && (
        <div className={cn('h-full min-h-0 border-r border-line', isDesktop ? 'w-80 shrink-0 lg:w-[340px]' : 'w-full')}>
          <Sidebar />
        </div>
      )}
      {showChat && (
        <div className={cn('h-full min-h-0 min-w-0 flex-1', !isDesktop && 'animate-slide-in')}>
          {userId ? <Conversation key={userId} userId={userId} /> : <NoChatSelected />}
        </div>
      )}
    </div>
  );
}
