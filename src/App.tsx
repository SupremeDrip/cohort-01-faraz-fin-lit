// Main application component with routing and authentication
// Manages app-wide state and navigation flow

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import StocksList from './pages/StocksList';
import StockDetail from './pages/StockDetail';
import Holdings from './pages/Holdings';
import Transactions from './pages/Transactions';
import SocialFeed from './pages/SocialFeed';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { profile } = useAuth();

  if (!profile) return null;

  if (profile.role === 'student') {
    return <StudentDashboard />;
  } else {
    return <ParentDashboard />;
  }
}

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" /> : <SignUp />}
      />
      <Route
        path="/onboarding"
        element={
          user ? (
            profile ? (
              <Navigate to="/dashboard" />
            ) : (
              <Onboarding />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Routes>
                <Route path="/dashboard" element={<DashboardRouter />} />
                <Route path="/stocks" element={profile?.role === 'student' ? <StocksList /> : <Navigate to="/dashboard" />} />
                <Route path="/stock/:symbol" element={profile?.role === 'student' ? <StockDetail /> : <Navigate to="/dashboard" />} />
                <Route path="/holdings" element={profile?.role === 'student' ? <Holdings /> : <Navigate to="/dashboard" />} />
                <Route path="/transactions" element={profile?.role === 'student' ? <Transactions /> : <Navigate to="/dashboard" />} />
                <Route path="/social" element={profile?.role === 'student' ? <SocialFeed /> : <Navigate to="/dashboard" />} />
                <Route path="/child-activity" element={profile?.role === 'parent' ? <ParentDashboard /> : <Navigate to="/dashboard" />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
