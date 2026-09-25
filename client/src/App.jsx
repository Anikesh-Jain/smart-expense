import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { getMe } from './features/auth/authSlice';

// Global Resilience & Helpers
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatusBanner from './components/common/NetworkStatusBanner';
import RouteLoadingFallback from './components/common/RouteLoadingFallback';

// Auth Guard & Layout
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AppLayout from './components/layout/AppLayout';

// Core Immediate Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Performance: Lazy-Loaded Sub-Modules & Authenticated Pages
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/transactions/TransactionsPage'));
const AddTransactionPage = lazy(() => import('./pages/transactions/AddTransactionPage'));
const BudgetsPage = lazy(() => import('./pages/budgets/BudgetsPage'));
const SavingsPage = lazy(() => import('./pages/savings/SavingsPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const SpendingPacePage = lazy(() => import('./pages/analytics/SpendingPacePage'));
const SavingPlanPage = lazy(() => import('./pages/analytics/SavingPlanPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage'));

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  // Re-hydrate authenticated user profile if token is present
  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [token, user, dispatch]);

  return (
    <ErrorBoundary>
      <NetworkStatusBanner />
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '0.875rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 10px 25px -5px rgba(2, 6, 23, 0.5)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#ffffff' },
            },
          }}
        />
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Standalone Protected Setup Route */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected App Routes wrapped in AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/add" element={<AddTransactionPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/spending-pace" element={<SpendingPacePage />} />
              <Route path="/saving-plan" element={<SavingPlanPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
