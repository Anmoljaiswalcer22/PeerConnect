import { ArrowRight, CheckCheck, Keyboard, Paperclip, Radio, ShieldCheck, Smartphone, Users } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { ButtonLink } from '../components/ui/Button';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';
import { useAuthStore } from '../stores/authStore';

const FEATURES = [
  {
    Icon: Radio,
    title: 'Real-time delivery',
    text: 'Socket.IO pushes every message the instant it’s saved. No polling, no refresh.',
  },
  {
    Icon: Users,
    title: 'Accurate presence',
    text: 'See who’s online right now. Multiple tabs and devices are handled correctly.',
  },
  {
    Icon: CheckCheck,
    title: 'Delivery & read receipts',
    text: 'One tick when sent, two when delivered, highlighted when read.',
  },
  {
    Icon: Keyboard,
    title: 'Typing indicators',
    text: 'Know when someone is replying, with rate-limited, lightweight events.',
  },
  {
    Icon: Paperclip,
    title: 'Images & files',
    text: 'Share photos and documents. Images are resized in the browser before upload.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure sessions',
    text: 'bcrypt-hashed passwords, httpOnly cookies and authenticated socket handshakes.',
  },
];

const PREVIEW_CONTACTS = [
  { name: 'Maya Chen', color: '#2f9e8f', msg: 'Pushed the fix, can you check?', time: '10:42', unread: 2, online: true, active: true },
  { name: 'Rohan Iyer', color: '#5b6ee1', msg: 'typing…', time: '10:39', typing: true, online: true },
  { name: 'Lena Fischer', color: '#a356c4', msg: 'You: Sounds good 👍', time: 'Yesterday' },
  { name: 'Tomás Ruiz', color: '#c0703a', msg: '📎 roadmap-q3.pdf', time: 'Mon' },
];

/** A static, illustrative mock of the app (fictional people). */
function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-1 shadow-pop" aria-hidden="true">
      <div className="flex h-9 items-center gap-1.5 border-b border-line px-4">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
      </div>
      <div className="grid h-[380px] grid-cols-1 sm:grid-cols-[240px_1fr]">
        <div className="hidden border-r border-line sm:block">
          <div className="px-4 py-3 text-sm font-semibold">Chats</div>
          <ul className="space-y-0.5 px-2">
            {PREVIEW_CONTACTS.map((c) => (
              <li key={c.name} className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${c.active ? 'bg-surface-3' : ''}`}>
                <span className="relative">
                  <span className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: c.color }}>
                    {c.name.split(' ').map((p) => p[0]).join('')}
                  </span>
                  {c.online && <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface-1 bg-success" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-[13px] font-medium">
                    {c.name}
                    <span className={`font-mono text-[10px] ${c.unread ? 'text-primary' : 'text-fg-subtle'}`}>{c.time}</span>
                  </span>
                  <span className="flex items-center justify-between gap-1">
                    <span className={`truncate text-[12px] ${c.typing ? 'text-primary' : 'text-fg-subtle'}`}>{c.msg}</span>
                    {c.unread && (
                      <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-content">
                        {c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-col bg-base-100">
          <div className="flex items-center gap-2.5 border-b border-line bg-surface-1 px-4 py-2.5">
            <span className="relative">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#2f9e8f] text-[11px] font-semibold text-white">MC</span>
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface-1 bg-success" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold">Maya Chen</span>
              <span className="block text-[11px] text-success">Online</span>
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-1.5 p-4">
            <div className="max-w-[75%] rounded-bubble rounded-bl-sm bg-surface-2 px-3 py-1.5 text-[13px]">Deploy finished, health check is green ✅</div>
            <div className="ml-auto flex max-w-[75%] items-end gap-1.5 rounded-bubble rounded-br-sm border border-bubble-out-line bg-bubble-out px-3 py-1.5 text-[13px] text-bubble-out-fg">
              Nice! Sockets reconnecting fine?
              <CheckCheck className="mb-0.5 size-3 shrink-0 text-primary" />
            </div>
            <div className="max-w-[75%] rounded-bubble bg-surface-2 px-3 py-1.5 text-[13px]">Yep, even across two tabs.</div>
            <div className="max-w-[75%] rounded-bubble rounded-bl-sm bg-surface-2 px-3 py-1.5 text-[13px]">Pushed the fix, can you check?</div>
            <div className="w-fit rounded-bubble rounded-bl-sm bg-surface-2 px-3 py-2.5 text-fg-muted">
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
          <div className="border-t border-line bg-surface-1 p-3">
            <div className="flex h-9 items-center rounded-xl border border-line bg-surface-2 px-3 text-[13px] text-fg-subtle">Write a message…</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const authUser = useAuthStore((s) => s.authUser);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-base-100/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2" aria-label="Account">
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>
            {authUser ? (
              <ButtonLink to="/chat" size="sm">
                Open app
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Log in
                </ButtonLink>
                <ButtonLink to="/signup" size="sm">
                  Get started
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-24">
          <div className="animate-rise-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-1 px-3 py-1 font-mono text-[12px] text-fg-muted">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              Real-time · MERN · Socket.IO
            </p>
            <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
              Conversations that
              <br />
              <span className="text-primary">keep up with you.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-fg-muted">
              PeerConnect is a fast one-to-one messenger with live presence, typing indicators and read receipts, and every
              message is saved even when your friend is offline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to={authUser ? '/chat' : '/signup'} size="lg">
                {authUser ? 'Open your chats' : 'Create a free account'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              {!authUser && (
                <ButtonLink to="/login" size="lg" variant="secondary">
                  I have an account
                </ButtonLink>
              )}
            </div>
            <p className="mt-6 flex items-center gap-2 text-meta text-fg-subtle">
              <Smartphone className="size-3.5" aria-hidden="true" />
              Works on desktop, tablet and mobile.
            </p>
          </div>
          <div className="animate-rise-in [animation-delay:120ms]">
            <ProductPreview />
          </div>
        </section>

        <section className="border-t border-line bg-surface-1/50" aria-labelledby="features-title">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="features-title" className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything a conversation needs. Nothing it doesn’t.
            </h2>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ Icon, title, text }) => (
                <li key={title} className="bg-base-100 p-6">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-fg-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-meta text-fg-subtle sm:flex-row sm:px-6">
          <Logo markClassName="size-6" />
          <p>Built with React, Express, MongoDB and Socket.IO.</p>
        </div>
      </footer>
    </div>
  );
}
