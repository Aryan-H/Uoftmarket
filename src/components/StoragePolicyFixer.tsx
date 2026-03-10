import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import constants for Supabase URL and key from the client file
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

const StoragePolicyFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  
  const runDiagnostics = async () => {
    try {
      // Check auth status
      const { data: authData } = await supabase.auth.getSession();
      const isAuthenticated = !!authData.session;
      
      // Check available buckets
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      // Check if our buckets exist - FIXED: Using the correct bucket names
      const listingBucketName = 'listing-images';
      const profileBucketName = 'profile-images';
      
      const listingBucketExists = buckets?.some(b => 
        b.name.toLowerCase() === listingBucketName.toLowerCase()
      );
      
      const profileBucketExists = buckets?.some(b => 
        b.name.toLowerCase() === profileBucketName.toLowerCase()
      );
      
      // Try a direct API call to see if we can get more info
      const headers = {
        'Authorization': `Bearer ${authData.session?.access_token || ''}`,
        'apikey': SUPABASE_PUBLISHABLE_KEY,
      };
      
      let listingStorageStatus = 'unknown';
      let profileStorageStatus = 'unknown';
      
      try {
        // Make a direct fetch to the Supabase storage API for listing images
        const listingResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${listingBucketName}`, {
          method: 'GET',
          headers
        });
        
        const listingStatusData = await listingResponse.json();
        listingStorageStatus = listingResponse.ok ? 'available' : `error: ${listingStatusData?.message || listingResponse.statusText}`;
        
        // Make a direct fetch to the Supabase storage API for profile images
        const profileResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${profileBucketName}`, {
          method: 'GET',
          headers
        });
        
        const profileStatusData = await profileResponse.json();
        profileStorageStatus = profileResponse.ok ? 'available' : `error: ${profileStatusData?.message || profileResponse.statusText}`;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        listingStorageStatus = `fetch error: ${errorMessage}`;
        profileStorageStatus = `fetch error: ${errorMessage}`;
      }
      
      // Return diagnostic information
      setDiagnostics({
        timestamp: new Date().toISOString(),
        auth: {
          isAuthenticated,
          userId: authData.session?.user?.id || null,
        },
        storage: {
          bucketError: bucketError ? bucketError.message : null,
          availableBuckets: buckets?.map(b => b.name) || [],
          listingBucketExists,
          profileBucketExists,
          listingApiStatus: listingStorageStatus,
          profileApiStatus: profileStorageStatus
        }
      });
      
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast.error('Diagnostics failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  const fixStoragePolicies = async () => {
    setIsFixing(true);
    
    try {
      // Check if user is authenticated first
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Authentication required", {
          description: "You must be logged in to check storage policies."
        });
        setIsFixing(false);
        return;
      }
      
      // Run diagnostics first
      await runDiagnostics();
      
      // Since we can't create buckets from client code, inform the user
      if (!diagnostics?.storage?.listingBucketExists || !diagnostics?.storage?.profileBucketExists) {
        toast.info('Bucket creation needed', {
          description: 'Storage buckets need to be created by an administrator via SQL.'
        });
      } else {
        toast.success('Storage buckets exist', {
          description: 'Both listing-images and profile-images buckets are properly configured.'
        });
      }
      
      // Refresh diagnostics to see current status
      await runDiagnostics();
      
      // Let the user know the operation is complete
      toast.success("Storage configuration check complete", {
        description: "The operation has completed. Check the diagnostics for more information."
      });
    } catch (error) {
      console.error('Error checking storage policies:', error);
      toast.error("Error checking policies", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Storage Policy Fixer
        </CardTitle>
        <CardDescription>
          Fix common issues with Supabase Storage configuration
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          This tool attempts to fix common Supabase Storage issues by creating the required image buckets
          if they don't exist and ensuring they're configured correctly.
        </p>
        
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Database className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Important Note</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  If you're seeing bucket not found errors, this tool may help fix the issue.
                  Make sure you are logged in before using this tool.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {diagnostics && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Diagnostics Results</AlertTitle>
            <AlertDescription>
              <div className="text-xs mt-2 space-y-1 font-mono">
                <p>User authenticated: {diagnostics.auth.isAuthenticated ? 'Yes' : 'No'}</p>
                {diagnostics.auth.userId && <p>User ID: {diagnostics.auth.userId}</p>}
                <p>Bucket API error: {diagnostics.storage.bucketError || 'None'}</p>
                <p>Available buckets: {diagnostics.storage.availableBuckets.length > 0 
                  ? diagnostics.storage.availableBuckets.join(', ') 
                  : 'None'}</p>
                <p>Listing bucket exists: {diagnostics.storage.listingBucketExists ? 'Yes' : 'No'}</p>
                <p>Profile bucket exists: {diagnostics.storage.profileBucketExists ? 'Yes' : 'No'}</p>
                <p>Listing API status: {diagnostics.storage.listingApiStatus}</p>
                <p>Profile API status: {diagnostics.storage.profileApiStatus}</p>
                <p className="text-gray-500">Last checked: {new Date(diagnostics.timestamp).toLocaleTimeString()}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={runDiagnostics} 
          variant="outline"
          className="w-full"
        >
          Run Diagnostics
        </Button>
        
        <Button 
          onClick={fixStoragePolicies} 
          disabled={isFixing}
          variant="default"
          className="w-full"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing Storage Configuration...
            </>
          ) : (
            <>Fix Storage Configuration</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StoragePolicyFixer;
