
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { toast } from 'sonner';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showRequestedPage?: boolean;
  requestPath?: string;
}

const AuthLayout = ({ 
  children, 
  title = "Welcome to UofT Market", 
  subtitle = "Sign in or create an account to get started",
  showRequestedPage = false,
  requestPath = '/'
}: AuthLayoutProps) => {
  const { hasMultipleActiveSessions, logout } = useCoreAuth();
  
  const handleForceSignOut = async () => {
    try {
      await logout();
      toast.success("All Sessions Ended", {
        description: "You have been signed out of all devices and tabs"
      });
      // Force page reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error("Error during force sign out:", error);
      toast.error("Error", {
        description: "There was a problem signing you out"
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-toronto-blue">
              UofT<span className="text-toronto-gold">Market</span>
            </span>
          </Link>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center space-x-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
        
        <div className="max-w-md mx-auto">
          {/* Multiple sessions warning banner */}
          {hasMultipleActiveSessions && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Multiple Sessions Detected
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You appear to be logged in on multiple tabs or devices. This may cause sync issues.
                    </p>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-yellow-800 border-yellow-600 hover:bg-yellow-100"
                        onClick={handleForceSignOut}
                      >
                        Sign out everywhere
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-soft p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-toronto-dark mb-2 font-display">{title}</h1>
              <p className="text-gray-600">{subtitle}</p>
              {showRequestedPage && requestPath !== '/' && (
                <p className="mt-2 text-toronto-blue text-sm">
                  Sign in to continue to the requested page
                </p>
              )}
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
