import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { Routes, Route, Navigate } from 'react-router-dom';
// Import pages here
// import DashboardPage from './pages/DashboardPage';
// import LoginPage from './pages/LoginPage';

// Error boundary for application
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log errors
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('App Error', error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return <div role="alert">Sorry, something went wrong.</div>;
    }
    return this.props.children;
  }
}

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (roles && user && !roles.some(role => user.roles.includes(role))) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* Protected Routes */}
          {/* <Route 
            path="/" 
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
          /> */}
          {/* Add more routes here */}
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
