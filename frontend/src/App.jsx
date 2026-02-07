import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback'; // Add import
import PostIdea from './pages/PostIdea';
import Profile from './pages/Profile';


import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// GuestRoute component to prevent authenticated users from accessing auth pages
const GuestRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  return user ? <Navigate to="/" replace /> : children;
};

// ProtectedRoute component (assuming it might be needed or existing logic to be consistent)
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  // Use a customized hook or logic to force re-render on auth change
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      // This triggers when Login page dispatches 'storage' event
      // Force a check or simple re-render
      const user = localStorage.getItem('user');
      if (user) {
        // If we are on login page, go home
        if (window.location.pathname === '/login') {
          navigate('/', { replace: true });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground pt-16">
        <Navbar />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                localStorage.getItem('user') ? <Home /> : <Login />
              }
            />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/post" element={<PostIdea />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

          </Routes>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
