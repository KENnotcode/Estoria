import { Component, type ComponentType, type ReactNode } from 'react';
import { ErrorFallback, type ErrorFallbackProps } from '@/components/ErrorFallback';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Defaults to `ErrorFallback`. */
  fallback?: ComponentType<ErrorFallbackProps>;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/** Catches render-time errors anywhere in the tree and shows a recovery screen. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (__DEV__) {
      console.error('[ErrorBoundary] Unhandled render error', error);
    }
  }

  private resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback: Fallback = ErrorFallback } = this.props;

    if (!error) {
      return children;
    }

    return <Fallback error={error} resetError={this.resetError} />;
  }
}
