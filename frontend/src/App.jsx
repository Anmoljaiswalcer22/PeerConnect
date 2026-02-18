import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards';
import { AppLayout } from './layouts/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { FullScreenLoader } from './components/ui/FullScreenLoader';
import ChatPage from './pages/ChatPage';

// The chat screen loads eagerly; everything else is split into separate chunks.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  // Restore the session (and connect the socket) once on page load.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/chat/:userId?" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          className: '!bg-surface-2 !text-fg !border !border-line !shadow-pop !rounded-xl !text-sm',
          success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-base-100)' } },
          error: { iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-base-100)' }, duration: 5000 },
        }}
      />
    </ErrorBoundary>
  );
}
