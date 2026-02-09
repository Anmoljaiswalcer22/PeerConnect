import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

/** Catches render errors so one broken component doesn't blank the whole app. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
        <div className="flex size-12 items-center justify-center rounded-xl border border-line bg-surface-2 text-warning">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 max-w-sm text-fg-muted">An unexpected error occurred. Reloading usually fixes it.</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reload
        </Button>
      </div>
    );
  }
}
