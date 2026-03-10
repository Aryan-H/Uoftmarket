
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { checkBucketExists } from '@/utils/supabaseStorage';
import { toast } from 'sonner';

const StorageBucketFixButton = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const checkBuckets = async () => {
    setIsChecking(true);
    setResult(null);
    
    try {
      // Check listing-images bucket
      console.log('Running storage bucket diagnostics...');
      const listingBucket = await checkBucketExists('listing-images');
      const profileBucket = await checkBucketExists('profile-images');
      
      const results = {
        timestamp: new Date().toISOString(),
        listingBucket,
        profileBucket,
        recommendations: []
      };
      
      // Add recommendations based on results
      if (!listingBucket.exists || !profileBucket.exists) {
        results.recommendations.push(
          'Storage buckets missing. Please ensure SQL migrations have been run.'
        );
        results.recommendations.push(
          'If you already ran migrations, check if you have administrative permissions.'
        );
      }
      
      if (listingBucket.error?.includes('Authentication') || profileBucket.error?.includes('Authentication')) {
        results.recommendations.push('Authentication issue detected. Try signing out and back in.');
      }
      
      setResult(results);
      
      // Show toast with summary
      if (!listingBucket.exists || !profileBucket.exists) {
        toast.error('Storage bucket issues detected', {
          description: 'One or more storage buckets are missing. Please run the SQL migration.'
        });
      } else {
        toast.success('Storage buckets verified', {
          description: 'Both required storage buckets exist.'
        });
      }
    } catch (error) {
      console.error('Error checking buckets:', error);
      toast.error('Bucket check failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div>
      <Button
        onClick={checkBuckets}
        disabled={isChecking}
        size="sm"
        variant="outline"
        className="my-2"
      >
        {isChecking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking Buckets...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Diagnose Storage Buckets
          </>
        )}
      </Button>
      
      {result && (
        <div className="text-xs bg-gray-50 p-3 rounded border mt-2">
          <h4 className="font-medium">Diagnostic Results:</h4>
          <div className="mt-1 space-y-1">
            <p>Listing Bucket: {result.listingBucket.exists ? '✅ Exists' : '❌ Missing'}</p>
            <p>Profile Bucket: {result.profileBucket.exists ? '✅ Exists' : '❌ Missing'}</p>
            
            {result.recommendations.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Recommendations:</p>
                <ul className="list-disc pl-4 mt-1">
                  {result.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-gray-500 mt-2">Checked at: {new Date(result.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageBucketFixButton;
