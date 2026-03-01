export function TypingIndicator({ name }) {
  return (
    <div className="mb-3 flex animate-message-in justify-start" aria-live="polite">
      <div className="flex items-center gap-2 rounded-bubble rounded-bl-sm bg-surface-2 px-3.5 py-3 text-fg-muted">
        <span className="typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="sr-only">{name} is typing</span>
      </div>
    </div>
  );
}
