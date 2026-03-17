import { Link } from 'react-router';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { Logo } from '../components/brand/Logo';
import { useAuthStore } from '../stores/authStore';

export default function NotFoundPage() {
  const authUser = useAuthStore((s) => s.authUser);

  return (
    <div className="flex min-h-dvh flex-col px-6 py-6">
      <Link to="/" aria-label="PeerConnect home" className="w-fit">
        <Logo />
      </Link>
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="animate-rise-in font-mono text-7xl font-medium tracking-tighter text-primary sm:text-8xl">404</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">This conversation doesn’t exist</h1>
        <p className="mt-2 max-w-sm text-fg-muted">The page you’re looking for was moved, deleted, or never existed.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" variant="secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Home
          </ButtonLink>
          <ButtonLink to={authUser ? '/chat' : '/login'}>
            <MessageSquare className="size-4" aria-hidden="true" />
            {authUser ? 'Go to chats' : 'Log in'}
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
