import React, { Component, ErrorInfo, ReactNode } from 'react';
import RuntimeErrorFallback from './RuntimeErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Top-level error boundary that catches render-time errors and displays a fallback UI.
 * Logs error details to console for debugging.
 */
export default class RuntimeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console for debugging
    console.error('Runtime Error Boundary caught an error:');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <RuntimeErrorFallback
          error={this.state.error}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}
