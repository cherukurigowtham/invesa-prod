import { Navigate } from 'react-router-dom';
import { apiService } from '../shared/lib/api';

export default function Dashboard() {
  const user = apiService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role-specific dashboard
  return <Navigate to={`/dashboard/${user.role}`} replace />;
}
