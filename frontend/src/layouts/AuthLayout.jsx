import { Link } from 'react-router';
import { CheckCheck, Radio, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';

const POINTS = [
  { Icon: Radio, title: 'Instant delivery', text: 'Messages arrive the moment they’re sent, no refresh needed.' },
  { Icon: CheckCheck, title: 'Know when it’s read', text: 'Delivery and read receipts on every message.' },
  { Icon: ShieldCheck, title: 'Secure by default', text: 'Hashed passwords and httpOnly session cookies.' },
];

/** Two-column auth screen: form on the left, product story on the right (large screens). */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="PeerConnect home">
            <Logo />
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-rise-in">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-fg-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-6 text-center text-fg-muted">{footer}</p>}
          </div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-surface-1 lg:flex lg:flex-col lg:justify-center lg:px-16">
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(var(--color-line-strong) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />
        <div className="relative max-w-md">
          <p className="font-mono text-meta text-primary">Real-time messaging</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Conversations that keep up with you.</h2>

          <div className="mt-10 space-y-2.5" aria-hidden="true">
            <div className="flex justify-start">
              <div className="rounded-bubble rounded-bl-sm bg-surface-2 px-3.5 py-2 text-message">Are you joining the demo at 4?</div>
            </div>
            <div className="flex justify-end">
              <div className="flex items-end gap-2 rounded-bubble rounded-br-sm border border-bubble-out-line bg-bubble-out px-3.5 py-2 text-message text-bubble-out-fg">
                On my way, saving you a seat
                <CheckCheck className="mb-0.5 size-3.5 text-primary" />
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-bubble rounded-bl-sm bg-surface-2 px-3.5 py-3 text-fg-muted">
                <span className="typing-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-12 space-y-5">
            {POINTS.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-meta text-fg-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
