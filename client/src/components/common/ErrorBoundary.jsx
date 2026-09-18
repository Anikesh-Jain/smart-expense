import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome, FiTrash2 } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to monitoring service (e.g. Sentry/Crashlytics) without sensitive parameters
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleResetState = () => {
    try {
      sessionStorage.clear();
      // Only remove non-auth app keys
      const keysToRemove = ['activeTab', 'themePreference'];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 sm:p-6 text-dark-100">
          <div className="max-w-lg w-full bg-dark-900/80 backdrop-blur-xl border border-dark-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-dark-950/80 relative overflow-hidden">
            {/* Ambient glass glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-expense-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-info-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Alert icon badge */}
              <div className="w-16 h-16 rounded-2xl bg-expense-500/15 border border-expense-500/30 flex items-center justify-center text-expense-400 mb-5 shadow-lg shadow-expense-500/10">
                <FiAlertTriangle className="text-3xl animate-pulse" />
              </div>

              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                Something went wrong
              </h1>

              <p className="text-dark-300 text-sm leading-relaxed mb-6">
                An unexpected interface error occurred. We have contained the issue so your saved financial records remain safe and untouched.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-4">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-info-600 hover:bg-info-500 text-white shadow-lg shadow-info-600/20 active:scale-[0.98] transition-all"
                >
                  <FiRefreshCw className="text-base" />
                  Reload Application
                </button>

                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 hover:text-white transition-all active:scale-[0.98]"
                >
                  <FiHome className="text-base" />
                  Return to Dashboard
                </button>
              </div>

              {/* Reset state action */}
              <button
                type="button"
                onClick={this.handleResetState}
                className="inline-flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-300 transition-colors py-1"
              >
                <FiTrash2 className="text-xs" />
                Clear transient cache & recover
              </button>

              {/* Developer Diagnostics (Only in development) */}
              {isDev && this.state.error && (
                <div className="mt-6 w-full text-left">
                  <details className="text-xs bg-dark-950/60 border border-dark-800 rounded-xl p-3 text-dark-300">
                    <summary className="font-semibold text-expense-400 cursor-pointer hover:underline">
                      Technical Details (Development Mode Only)
                    </summary>
                    <pre className="mt-2 text-[11px] font-mono text-dark-300 overflow-x-auto p-2 bg-black/40 rounded-lg whitespace-pre-wrap break-all">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
