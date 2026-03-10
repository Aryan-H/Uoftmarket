
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const [processingAuth, setProcessingAuth] = useState(true);
  
  useEffect(() => {
    // Process authentication when component mounts
    const processAuth = async () => {
      try {
        // Clear any stale data from local storage
        localStorage.removeItem('userListings');
        localStorage.removeItem('flaggedListings');
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          toast.error('Authentication Error', {
            description: 'There was a problem verifying your email. Please try signing in manually.'
          });
          setProcessingAuth(false);
          return;
        }
        
        if (data.session) {
          // We have a valid session
          toast.success('Email Verified', {
            description: 'Your email has been successfully verified!'
          });
          
          // Short delay before redirecting to allow toast to be seen
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          // No session found - let user manually sign in
          setProcessingAuth(false);
        }
      } catch (error) {
        console.error('Error in verification process:', error);
        setProcessingAuth(false);
      }
    };
    
    processAuth();
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="rounded-md bg-toronto-blue p-1">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-toronto-dark">
              UofT<span className="text-toronto-blue">Market</span>
            </span>
          </Link>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-soft p-8 animate-fade-in text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-toronto-dark mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">
              {processingAuth 
                ? "We're completing your verification process..." 
                : "Your email has been verified. You can now sign in to your account."}
            </p>
            
            {!processingAuth && (
              <Button 
                className="w-full bg-toronto-blue hover:bg-toronto-blue/90"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess;
