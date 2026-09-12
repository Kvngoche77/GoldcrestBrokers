'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives error and a reset handler. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Label shown in the default fallback (e.g. "Portfolio Chart") */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * DashboardErrorBoundary
 *
 * Wraps any section of the dashboard so that a JS error in one section
 * does not crash the entire page.
 *
 * Usage:
 *   <DashboardErrorBoundary section="Portfolio Chart">
 *     <PortfolioChart />
 *   </DashboardErrorBoundary>
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev; swap with your error-tracking service (e.g. Sentry) in production
    console.error(`[ErrorBoundary] ${this.props.section ?? 'Section'} crashed:`, error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, section } = this.props;

    if (hasError && error) {
      if (fallback) return fallback(error, this.reset);

      return (
        <div className="glass rounded-2xl p-6 border border-red-500/20 bg-red-500/[0.04] flex flex-col items-center justify-center text-center gap-3 min-h-[140px]">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              {section ? `${section} failed to load` : 'Something went wrong'}
            </p>
            <p className="text-xs text-slate-500 max-w-xs">
              {error.message || 'An unexpected error occurred in this section.'}
            </p>
          </div>
          <button
            onClick={this.reset}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw size={12} />
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}

export default DashboardErrorBoundary;
