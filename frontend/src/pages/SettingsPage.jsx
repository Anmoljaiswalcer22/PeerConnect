import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { ACCENTS } from '../constants/themes';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../utils/cn';

const MODES = [
  { id: 'dark', label: 'Dark', Icon: Moon, preview: 'ember-dark' },
  { id: 'light', label: 'Light', Icon: Sun, preview: 'ember-light' },
  { id: 'system', label: 'System', Icon: Monitor, preview: null },
];

/** A tiny mock of the chat screen rendered in a specific theme. */
function ThemePreview({ theme, accent }) {
  return (
    <div data-theme={theme} data-accent={accent} className="flex h-20 overflow-hidden rounded-lg border border-line bg-base-100">
      <div className="w-1/3 space-y-1.5 border-r border-line bg-surface-1 p-2">
        <div className="h-1.5 w-3/4 rounded bg-line-strong" />
        <div className="h-1.5 w-1/2 rounded bg-line" />
        <div className="h-1.5 w-2/3 rounded bg-line" />
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1 p-2">
        <div className="h-3 w-3/5 rounded-md bg-surface-2" />
        <div className="ml-auto h-3 w-1/2 rounded-md border border-bubble-out-line bg-bubble-out" />
        <div className="ml-auto h-1.5 w-6 rounded bg-primary" />
      </div>
    </div>
  );
}

function SplitPreview({ accent }) {
  return (
    <div className="grid h-20 grid-cols-2 overflow-hidden rounded-lg border border-line">
      <div data-theme="ember-dark" data-accent={accent} className="flex items-end justify-end bg-base-100 p-2">
        <div className="h-3 w-3/4 rounded-md border border-bubble-out-line bg-bubble-out" />
      </div>
      <div data-theme="ember-light" data-accent={accent} className="flex items-end justify-end bg-base-100 p-2">
        <div className="h-3 w-3/4 rounded-md border border-bubble-out-line bg-bubble-out" />
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <header className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-meta text-fg-subtle">{description}</p>}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function Kbd({ children }) {
  return <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">{children}</kbd>;
}

export default function SettingsPage() {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Settings" description="Personalise how PeerConnect looks on this device" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl animate-rise-in space-y-6 px-4 py-8 sm:px-6">
          <Section title="Theme" description="Saved on this device and applied instantly.">
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MODES.map(({ id, label, Icon, preview }) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(id)}
                    className={cn(
                      'rounded-xl border p-2.5 text-left transition-colors duration-150',
                      active ? 'border-primary bg-primary-subtle' : 'border-line hover:border-line-strong',
                    )}
                  >
                    {preview ? <ThemePreview theme={preview} accent={accent} /> : <SplitPreview accent={accent} />}
                    <span className="mt-2.5 flex items-center justify-between px-0.5">
                      <span className="flex items-center gap-2 font-medium">
                        <Icon className="size-4 text-fg-muted" aria-hidden="true" />
                        {label}
                      </span>
                      {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Accent colour" description="Used for buttons, your message bubbles and highlights.">
            <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-3">
              {ACCENTS.map((option) => {
                const active = accent === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setAccent(option.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 transition-colors duration-150',
                      active ? 'border-primary bg-primary-subtle' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full" style={{ backgroundColor: option.swatch }}>
                      {active && <Check className="size-3.5 text-black/80" aria-hidden="true" />}
                    </span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 rounded-lg border border-line bg-base-100 p-4" aria-label="Preview">
              <div className="flex justify-start">
                <div className="rounded-bubble rounded-bl-sm bg-surface-2 px-3.5 py-2 text-message">How does this colour look?</div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-bubble rounded-br-sm border border-bubble-out-line bg-bubble-out px-3.5 py-2 text-message text-bubble-out-fg">
                  Looks great on me ✨
                </div>
              </div>
            </div>
          </Section>

          <Section title="Keyboard shortcuts">
            <dl className="divide-y divide-line">
              {[
                ['Send message', <Kbd key="e">Enter</Kbd>],
                [
                  'New line',
                  <span key="se">
                    <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd>
                  </span>,
                ],
                ['Close conversation', <Kbd key="esc">Esc</Kbd>],
              ].map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <dt className="text-fg-muted">{label}</dt>
                  <dd>{keys}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}
