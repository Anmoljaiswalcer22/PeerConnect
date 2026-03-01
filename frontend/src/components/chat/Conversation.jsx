import { RefreshCw, UserX } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MessageSkeleton } from './Skeletons';
import { EmptyState } from '../ui/EmptyState';
import { Button, ButtonLink } from '../ui/Button';

/** The open chat: header, history and composer. */
export function Conversation({ userId }) {
  const myId = useAuthStore((s) => s.authUser?._id);
  const peer = useChatStore((s) => s.peer);
  const isLoading = useChatStore((s) => s.isMessagesLoading);
  const error = useChatStore((s) => s.messagesError);
  const selectUser = useChatStore((s) => s.selectUser);

  if (error === 'not-found') {
    return (
      <div className="flex h-full flex-col bg-base-100">
        <EmptyState
          icon={UserX}
          title="User not found"
          className="flex-1"
          action={
            <ButtonLink to="/chat" variant="secondary" size="sm">
              Back to chats
            </ButtonLink>
          }
        >
          This account doesn't exist or was removed.
        </EmptyState>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-base-100" aria-label="Conversation">
      <ChatHeader peer={peer} />
      {error ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load messages"
          className="flex-1"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                useChatStore.setState({ selectedUserId: null });
                selectUser(userId);
              }}
            >
              Try again
            </Button>
          }
        >
          {error}
        </EmptyState>
      ) : isLoading ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <MessageSkeleton />
        </div>
      ) : (
        <MessageList myId={myId} peer={peer} />
      )}
      <MessageInput peerId={userId} />
    </section>
  );
}
