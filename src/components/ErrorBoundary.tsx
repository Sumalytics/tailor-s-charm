import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error logging service here (e.g., Sentry, LogRocket)
      console.error('Production Error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
        retryCount={this.state.retryCount}
        maxRetries={this.maxRetries}
      />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ 
  error, 
  onRetry, 
  onGoHome, 
  retryCount, 
  maxRetries 
}: {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
  retryCount: number;
  maxRetries: number;
}) {
  const { isOnline, isOffline } = useNetworkStatus();

  const isFirebaseError = error?.message?.toLowerCase().includes('firebase') ||
                         error?.message?.toLowerCase().includes('network') ||
                         error?.message?.toLowerCase().includes('connection');

  const canRetry = retryCount < maxRetries;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <CardTitle className="text-xl">
              {isFirebaseError && isOffline ? 'Connection Error' : 'Something went wrong'}
            </CardTitle>
            
            <CardDescription>
              {isFirebaseError && isOffline 
                ? 'Unable to connect to our servers. Please check your internet connection.'
                : 'An unexpected error occurred. We\'re working to fix this.'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Error details:</h3>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}

            {isOffline && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 mb-2">Connection Status:</h3>
                <p className="text-sm text-orange-700">
                  You appear to be offline. Please check your internet connection and try again.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {canRetry && (
                <Button 
                  onClick={onRetry}
                  className="flex-1"
                  disabled={isOffline}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry ({maxRetries - retryCount} attempts left)
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={onGoHome}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            {!canRetry && (
              <div className="text-center text-sm text-gray-500">
                <p>Maximum retry attempts reached.</p>
                <p>Please refresh the page or contact support if the problem persists.</p>
              </div>
            )}

            <div className="text-center text-xs text-gray-400">
              Error ID: {Date.now().toString(36)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ErrorBoundary;
