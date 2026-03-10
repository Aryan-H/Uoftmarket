
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { clearAllLocalStorage } from '@/utils/storageUtils';
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempted: boolean;
}

class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryAttempted: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Authentication error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    // Clear potentially corrupted auth state
    clearAllLocalStorage();
    
    toast.info("Auth state reset", { 
      description: "Session data has been cleared. Redirecting..." 
    });
    
    // Reload the page to get a fresh state
    setTimeout(() => {
      window.location.href = '/auth';
    }, 1500);
  };

  private handleContinue = () => {
    this.setState({ hasError: false, error: null, recoveryAttempted: true });
    
    // If we're continuing without reset, at least refresh the page
    // to ensure we have the latest state
    if (this.state.recoveryAttempted) {
      window.location.reload();
    }
  };

  private handleRefresh = () => {
    // Just refresh the page without clearing storage
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <CardTitle className="text-xl text-center">Authentication Error</CardTitle>
              <CardDescription className="text-center">
                There was a problem with the authentication system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                <p className="mb-2">This could be due to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>An expired session</li>
                  <li>Corrupted local data</li>
                  <li>Network connectivity issues</li>
                  <li>Server-side authentication problems</li>
                </ul>
              </div>
              {this.state.error && (
                <div className="bg-gray-100 p-2 rounded text-xs text-gray-700 font-mono overflow-auto max-h-24">
                  {this.state.error.toString()}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="flex gap-2 w-full">
                <Button 
                  variant="destructive" 
                  onClick={this.handleReset}
                  className="w-full"
                >
                  Reset & Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleContinue}
                  className="w-full"
                >
                  Try to Continue
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={this.handleRefresh}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
