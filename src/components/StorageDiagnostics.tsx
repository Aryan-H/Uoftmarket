
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { checkBucketExists } from '@/utils/supabaseStorage';
import { toast } from 'sonner';
import StorageBucketFixButton from './StorageBucketFixButton';
import { supabase } from '@/integrations/supabase/client';

const StorageDiagnostics = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const runDiagnostics = async () => {
    setIsChecking(true);
    
    try {
      // Check authentication state
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthenticated = !!sessionData.session;
      
      if (!isAuthenticated) {
        toast.error('Authentication required', {
          description: 'You must be logged in to check storage buckets.'
        });
        setResults({
          authenticated: false,
          error: 'Not authenticated'
        });
        return;
      }
      
      // Check bucket existence and report detailed status
      const listingBucketCheck = await checkBucketExists('listing-images');
      const profileBucketCheck = await checkBucketExists('profile-images');
      
      // Display the results
      setResults({
        authenticated: true,
        timestamp: new Date().toISOString(),
        userId: sessionData.session?.user?.id,
        buckets: {
          'listing-images': {
            exists: listingBucketCheck.exists,
            error: listingBucketCheck.error
          },
          'profile-images': {
            exists: profileBucketCheck.exists,
            error: profileBucketCheck.error
          }
        }
      });
      
      // Show summary toast
      if (listingBucketCheck.exists && profileBucketCheck.exists) {
        toast.success('Storage buckets verified', {
          description: 'All required storage buckets exist and are accessible.'
        });
      } else {
        toast.error('Storage bucket issues detected', {
          description: 'One or more required buckets are missing or inaccessible.'
        });
      }
    } catch (error) {
      console.error('Error checking storage buckets:', error);
      toast.error('Diagnostic error', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={runDiagnostics} 
            variant="outline" 
            disabled={isChecking}
            size="sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Buckets...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Storage Buckets
              </>
            )}
          </Button>
        </div>
        
        {results && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Results from {new Date(results.timestamp).toLocaleTimeString()}</p>
            
            {results.error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}
            
            {results.authenticated === false && (
              <Alert variant="destructive">
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  You must be logged in to check storage buckets. Please sign in and try again.
                </AlertDescription>
              </Alert>
            )}
            
            {results.buckets && (
              <div className="space-y-2">
                {Object.entries(results.buckets).map(([bucket, status]: [string, any]) => (
                  <Alert key={bucket} variant={status.exists ? "default" : "destructive"}>
                    {status.exists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertTitle>{bucket}</AlertTitle>
                    <AlertDescription>
                      {status.exists 
                        ? 'Bucket exists and is accessible'
                        : `Bucket is missing or inaccessible: ${status.error}`
                      }
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Storage Bucket Fix</h4>
          <p className="text-sm text-muted-foreground mb-4">
            If the buckets are not accessible, you can try to diagnose and fix them:
          </p>
          <StorageBucketFixButton />
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageDiagnostics;
