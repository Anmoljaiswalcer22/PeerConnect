import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from './IconButton';

/** Header for profile/settings. Shows a back button on mobile, where there's no nav rail. */
export function PageHeader({ title, description }) {
  const navigate = useNavigate();
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface-1 px-3 sm:px-6">
      <IconButton label="Back to chats" className="md:hidden" onClick={() => navigate('/chat')}>
        <ArrowLeft className="size-5" />
      </IconButton>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {description && <p className="hidden truncate text-meta text-fg-subtle sm:block">{description}</p>}
      </div>
    </header>
  );
}
