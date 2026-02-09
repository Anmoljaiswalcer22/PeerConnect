import { useEffect, useState } from 'react';
import { LogoMark } from '../brand/Logo';

/** Shown while the session is being restored. Explains Render cold starts if it takes a while. */
export function FullScreenLoader() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center" role="status" aria-live="polite">
      <LogoMark className="size-10 animate-pulse" />
      <span className="sr-only">Loading</span>
      {slow && (
        <p className="max-w-xs animate-fade-in text-meta text-fg-muted">
          Waking up the server… This can take up to a minute after a period of inactivity.
        </p>
      )}
    </div>
  );
}
