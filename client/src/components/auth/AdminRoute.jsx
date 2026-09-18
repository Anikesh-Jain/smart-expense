import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMe } from '../../features/auth/authSlice';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { FiShieldOff, FiHome } from 'react-icons/fi';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, token, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [token, user, dispatch]);

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading && !user) {
    return <LoadingSpinner fullPage message="Verifying administrative privileges..." />;
  }

  // If authenticated user is NOT an admin, display 403 Forbidden Screen
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-dark-900 border border-dark-750 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-expense-500/10 text-expense-400 border border-expense-500/20 flex items-center justify-center mx-auto mb-4">
            <FiShieldOff className="text-3xl" />
          </div>
          <span className="px-2.5 py-1 rounded-md bg-expense-500/10 text-expense-400 text-xs font-mono font-bold uppercase tracking-wider">
            403 Forbidden
          </span>
          <h2 className="text-xl font-bold text-white mt-3 mb-2">
            Administrator Access Required
          </h2>
          <p className="text-xs text-dark-400 leading-relaxed mb-6">
            The requested area is restricted to system administrators. Your account (<span className="text-dark-200 font-medium">{user.email}</span>) does not have administrative clearance.
          </p>
          <div className="flex justify-center">
            <Button
              variant="primary"
              icon={FiHome}
              onClick={() => navigate('/')}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
