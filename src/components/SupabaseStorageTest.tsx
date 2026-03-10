
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import { testSupabaseStorage, diagnoseBucketIssues } from '@/utils/supabaseStorageTest';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';

const SupabaseStorageTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const checkAuthStatus = async () => {
    const { data } = await supabase.auth.getSession();
    const isAuthed = !!data.session;
    setIsAuthenticated(isAuthed);
    return isAuthed;
  };
  
  const runTest = async () => {
    setIsLoading(true);
    try {
      // First check if user is authenticated
      const isAuthed = await checkAuthStatus();
      
      if (!isAuthed) {
        toast.error("Authentication required", {
          description: "You must be logged in to test Supabase Storage."
        });
        
        setResult({
          success: false,
          details: {
            error: "Authentication required. Please sign in first."
          }
        });
        
        setIsLoading(false);
        return;
      }
      
      const testResult = await testSupabaseStorage();
      setResult(testResult);
      
      if (testResult.success) {
        toast.success("Storage test successful!", {
          description: "Your Supabase storage is configured correctly."
        });
      } else {
        toast.error("Storage test failed", {
          description: "There are issues with your Supabase storage configuration."
        });
      }
    } catch (error) {
      console.error("Error running storage test:", error);
      toast.error("Test failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Supabase Storage Diagnostics</h3>
      
      <div className="flex flex-col md:flex-row gap-2">
        <Button 
          onClick={runTest}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Test...
            </>
          ) : (
            <>Test Storage Connection</>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const suggestions = await diagnoseBucketIssues();
            toast("Diagnostic suggestions", {
              description: suggestions.suggestions.join(' ')
            });
          }}
          disabled={isLoading}
        >
          <FileText className="mr-2 h-4 w-4" />
          Get Suggestions
        </Button>
      </div>
      
      {isAuthenticated !== null && (
        <Alert variant={isAuthenticated ? "default" : "destructive"}>
          <AlertTitle>
            Authentication Status: {isAuthenticated ? "Logged In" : "Not Logged In"}
          </AlertTitle>
          <AlertDescription>
            {isAuthenticated ? 
              "You are logged in and should be able to use storage features." : 
              "You must be logged in to use Supabase Storage due to Row Level Security policies."}
          </AlertDescription>
        </Alert>
      )}
      
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success ? "Storage is working correctly" : "Storage configuration issues"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {result.success ? (
              <div className="space-y-2">
                <p>Your Supabase storage is properly configured and ready for use.</p>
                <ul className="list-disc pl-5 text-xs text-gray-600">
                  <li>Bucket exists: {result.details.bucketExists ? 'Yes' : 'No'}</li>
                  <li>Bucket is public: {result.details.bucketIsPublic ? 'Yes' : 'No'}</li>
                  <li>Can list files: {result.details.canList ? 'Yes' : 'No'}</li>
                  <li>Can upload files: {result.details.canUpload ? 'Yes' : 'No'}</li>
                  {result.details.path && <li>Test file path: {result.details.path}</li>}
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <p>The following issues were detected:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.details.error && (
                    <li className="text-red-500">{result.details.error}</li>
                  )}
                  {result.details.bucketExists === false && (
                    <li>The bucket 'listing-images' doesn't exist</li>
                  )}
                  {result.details.bucketExists && result.details.bucketIsPublic === false && (
                    <li>The bucket exists but is not public</li>
                  )}
                  {result.details.bucketExists && result.details.canList === false && (
                    <li>Cannot list files (check SELECT permissions)</li>
                  )}
                  {result.details.bucketExists && result.details.canUpload === false && (
                    <li>Cannot upload files (check INSERT permissions)</li>
                  )}
                </ul>
                <p className="text-sm mt-2">
                  Try running the SQL migration again or check your Supabase configuration.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        <p>Requirements for Supabase Storage to work:</p>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>The 'Listing Images' bucket must exist</li>
          <li>The bucket must be public</li>
          <li>You must be authenticated to upload files</li>
          <li>File paths must include the user ID as the first segment</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseStorageTest;
