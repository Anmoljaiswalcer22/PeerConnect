import { memo } from 'react';
import { Download, FileText, RotateCcw, Trash2 } from 'lucide-react';
import { MessageStatus } from './MessageStatus';
import { formatBytes, formatTime } from '../../utils/format';
import { cn } from '../../utils/cn';

function ImageAttachment({ message }) {
  const src = message.attachment?.url ?? message.localPreview;
  if (!src) return null;
  const { width, height } = message.attachment ?? {};
  return (
    <a
      href={message.attachment?.url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('block overflow-hidden rounded-xl', !message.attachment?.url && 'pointer-events-none')}
    >
      <img
        src={src}
        alt={message.text || 'Shared image'}
        loading="lazy"
        width={width}
        height={height}
        className={cn('max-h-80 w-auto max-w-full object-cover', message.status === 'sending' && 'opacity-70')}
        style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
      />
    </a>
  );
}

function FileAttachment({ message, isOwn }) {
  const { name, size, url } = message.attachment ?? {};
  const Wrapper = url ? 'a' : 'div';
  return (
    <Wrapper
      {...(url && { href: url, target: '_blank', rel: 'noopener noreferrer', download: name })}
      className={cn(
        'flex min-w-56 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        isOwn ? 'border-bubble-out-line hover:bg-black/5' : 'border-line hover:bg-surface-3',
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
        <FileText className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block font-mono text-[11px] opacity-60">{formatBytes(size)}</span>
      </span>
      {url && <Download className="size-4 shrink-0 opacity-60" aria-hidden="true" />}
    </Wrapper>
  );
}

/**
 * One message. Consecutive messages from the same person are grouped: only
 * the last in a group gets the "tail" corner and extra spacing.
 */
export const MessageBubble = memo(function MessageBubble({ message, isOwn, isLastInGroup, onRetry, onDiscard }) {
  const hasMedia = message.type === 'image' || message.type === 'file';
  const failed = message.status === 'failed';

  return (
    <div className={cn('flex animate-message-in', isOwn ? 'justify-end' : 'justify-start', isLastInGroup ? 'mb-3' : 'mb-0.5')}>
      <div className={cn('flex max-w-[85%] flex-col sm:max-w-[68%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-bubble text-message',
            hasMedia ? 'p-1.5' : 'px-3.5 py-2',
            isOwn ? 'border border-bubble-out-line bg-bubble-out text-bubble-out-fg' : 'bg-surface-2 text-fg',
            isLastInGroup && (isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'),
            failed && 'border-error/60',
          )}
        >
          {message.type === 'image' && <ImageAttachment message={message} />}
          {message.type === 'file' && <FileAttachment message={message} isOwn={isOwn} />}

          {message.text && (
            <p className={cn('[overflow-wrap:anywhere] whitespace-pre-wrap', hasMedia && 'px-2 pt-1.5 pb-0.5')}>
              {message.text}
            </p>
          )}

          <div
            className={cn(
              'mt-0.5 flex items-center justify-end gap-1 font-mono text-[11px]',
              isOwn ? 'opacity-70' : 'text-fg-subtle',
              hasMedia && 'px-2 pb-0.5',
            )}
          >
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {isOwn && <MessageStatus status={message.status} />}
          </div>
        </div>

        {failed && (
          <div className="mt-1 flex items-center gap-1 text-meta text-error">
            <span>Not sent.</span>
            <button type="button" onClick={() => onRetry(message.clientMessageId)} className="inline-flex items-center gap-1 rounded px-1 font-medium hover:underline">
              <RotateCcw className="size-3" aria-hidden="true" />
              Retry
            </button>
            <button type="button" onClick={() => onDiscard(message.clientMessageId)} className="inline-flex items-center gap-1 rounded px-1 text-fg-subtle hover:text-fg">
              <Trash2 className="size-3" aria-hidden="true" />
              Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
