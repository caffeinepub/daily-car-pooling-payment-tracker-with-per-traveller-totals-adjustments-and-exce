import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import EmptyState from './EmptyState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <EmptyState
              icon={AlertTriangle}
              title="Something went wrong"
              description="An unexpected error occurred. Please reload the page to continue."
              action={{
                label: 'Reload Page',
                onClick: this.handleReload,
              }}
            />
            {this.state.error && (
              <details className="mt-4 p-4 bg-muted rounded-lg text-sm">
                <summary className="cursor-pointer font-medium">Error details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
