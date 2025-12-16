"use client";

import React, { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="max-w-md w-full">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 p-4 bg-destructive/10 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-destructive">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 text-sm overflow-auto max-h-48 text-destructive">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
