import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
