import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';

/** Only for logged-in users; others go to /login and come back afterwards. */
export function ProtectedRoute() {
  const authUser = useAuthStore((s) => s.authUser);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const location = useLocation();

  if (isCheckingAuth) return <FullScreenLoader />;
  if (!authUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Login / signup / landing: logged-in users go straight to their chats. */
export function PublicOnlyRoute() {
  const authUser = useAuthStore((s) => s.authUser);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);

  if (isCheckingAuth) return <FullScreenLoader />;
  if (authUser) return <Navigate to="/chat" replace />;
  return <Outlet />;
}
