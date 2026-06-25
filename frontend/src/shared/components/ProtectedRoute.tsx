import { Navigate, useLocation } from 'react-router-dom';
import { apiService } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const user = apiService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    // Redirect to login, but keep the current location path to return to
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  if (role && user.role !== role) {
    // If a non-matching user tries to access a restricted role route
    return <Navigate to="/ideas" replace />;
  }

  return <>{children}</>;
}
