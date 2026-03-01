import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Loader2, Paperclip, SendHorizontal, X } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { IconButton } from '../ui/IconButton';
import {
  ATTACHMENT_ACCEPT,
  FILE_TYPES,
  IMAGE_TYPES,
  MAX_ATTACHMENT_BYTES,
  compressImage,
  dataUrlBytes,
  readAsDataUrl,
} from '../../utils/files';
import { formatBytes } from '../../utils/format';
import { cn } from '../../utils/cn';

const TYPING_REPEAT_MS = 2000;
const TYPING_IDLE_MS = 3000;
const MAX_LENGTH = 2000;

/** Sends typing / stopTyping at a limited rate while the user types. */
function useTypingEmitter(peerId) {
  const emitTyping = useChatStore((s) => s.emitTyping);
  const emitStopTyping = useChatStore((s) => s.emitStopTyping);
  const state = useRef({ active: false, lastSent: 0, idleTimer: null });

  const stop = () => {
    const s = state.current;
    clearTimeout(s.idleTimer);
    if (s.active && peerId) emitStopTyping(peerId);
    s.active = false;
  };

  const ping = () => {
    if (!peerId) return;
    const s = state.current;
    const now = Date.now();
    if (!s.active || now - s.lastSent > TYPING_REPEAT_MS) {
      emitTyping(peerId);
      s.lastSent = now;
      s.active = true;
    }
    clearTimeout(s.idleTimer);
    s.idleTimer = setTimeout(stop, TYPING_IDLE_MS);
  };

  // Stop when switching conversations or leaving.
  useEffect(() => stop, [peerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ping, stop };
}

export function MessageInput({ peerId }) {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const { ping, stop } = useTypingEmitter(peerId);

  // Reset the draft and focus the input when switching chats (desktop).
  useEffect(() => {
    setText('');
    setAttachment(null);
    if (window.matchMedia('(min-width: 768px)').matches) textareaRef.current?.focus();
  }, [peerId]);

  // Auto-grow the textarea up to ~6 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const canSend = (text.trim().length > 0 || attachment) && !isPreparing;

  const handleChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) ping();
    else stop();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isImage = IMAGE_TYPES.includes(file.type);
    if (!isImage && !FILE_TYPES.includes(file.type)) {
      toast.error('That file type isn’t supported. Try an image, PDF, document, spreadsheet, text or zip file.');
      return;
    }

    setIsPreparing(true);
    try {
      const prepared = isImage ? await compressImage(file) : { dataUrl: await readAsDataUrl(file) };
      const size = dataUrlBytes(prepared.dataUrl);
      if (size > MAX_ATTACHMENT_BYTES) {
        toast.error(`Files must be under ${formatBytes(MAX_ATTACHMENT_BYTES)} (this one is ${formatBytes(size)}).`);
        return;
      }
      const mimeType = prepared.dataUrl.slice(5, prepared.dataUrl.indexOf(';'));
      setAttachment({ ...prepared, name: file.name, size, mimeType });
      textareaRef.current?.focus();
    } catch {
      toast.error('Could not read that file.');
    } finally {
      setIsPreparing(false);
    }
  };

  const submit = (e) => {
    e?.preventDefault();
    if (!canSend) return;
    sendMessage({ text: text.trim(), attachment: attachment ?? undefined });
    setText('');
    setAttachment(null);
    stop();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line. Ignore Enter while an IME is composing.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-line bg-surface-1 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      {attachment && (
        <div className="mb-2 flex animate-rise-in items-center gap-3 rounded-xl border border-line bg-surface-2 p-2">
          {attachment.mimeType.startsWith('image/') ? (
            <img src={attachment.dataUrl} alt="" className="size-12 rounded-lg object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.name}</p>
            <p className="font-mono text-[11px] text-fg-subtle">{formatBytes(attachment.size)}</p>
          </div>
          <IconButton label="Remove attachment" size="sm" onClick={() => setAttachment(null)}>
            <X className="size-4" />
          </IconButton>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" accept={ATTACHMENT_ACCEPT} className="hidden" onChange={handleFile} tabIndex={-1} />
        <IconButton label="Attach a file" onClick={() => fileRef.current?.click()} disabled={isPreparing} className="mb-0.5">
          {isPreparing ? <Loader2 className="size-[18px] animate-spin" /> : <Paperclip className="size-[18px]" />}
        </IconButton>

        <label htmlFor="message-input" className="sr-only">
          Message
        </label>
        <textarea
          id="message-input"
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={stop}
          placeholder="Write a message…"
          className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-message leading-5 text-fg placeholder:text-fg-subtle transition-colors hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary-subtle focus:outline-none focus-visible:outline-none"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            'mb-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
            canSend ? 'bg-primary text-primary-content hover:bg-primary-hover' : 'bg-surface-3 text-fg-subtle',
          )}
        >
          <SendHorizontal className="size-[18px]" />
        </button>
      </div>
      {text.length > MAX_LENGTH - 200 && (
        <p className="mt-1 text-right font-mono text-[11px] text-fg-subtle">
          {text.length}/{MAX_LENGTH}
        </p>
      )}
    </form>
  );
}
