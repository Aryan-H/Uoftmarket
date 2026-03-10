
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Download, Shield } from 'lucide-react';
import { getDirectDownloadUrl, tryObjectUrlFallback } from '@/utils/supabaseImageUtils';
import { testImageUrl } from '@/utils/imageUtils';

interface ImageErrorHandlerProps {
  imageUrl: string;
  onRetry: () => void;
  className?: string;
}

const ImageErrorHandler = ({ imageUrl, onRetry, className = '' }: ImageErrorHandlerProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const isSupabaseUrl = imageUrl.includes('supabase.co/storage');
  
  useEffect(() => {
    // Run basic diagnostics when component mounts
    const runDiagnostics = async () => {
      setIsLoading(true);
      
      try {
        // Run a basic test to see what's wrong
        const testResult = await testImageUrl(imageUrl);
        setDiagnosticInfo(testResult);
      } catch (err) {
        console.error('Error running diagnostics:', err);
        setDiagnosticInfo({
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    runDiagnostics();
  }, [imageUrl]);
  
  const handleDownloadDirect = async () => {
    if (!isSupabaseUrl) return;
    
    setIsLoading(true);
    try {
      const directUrl = await getDirectDownloadUrl(imageUrl, true);
      if (directUrl) {
        console.log('Opening direct download URL in new tab:', directUrl);
        window.open(directUrl, '_blank');
      } else {
        console.error('Could not generate direct download URL');
        
        // Try object URL as fallback
        const { success, objectUrl } = await tryObjectUrlFallback(imageUrl);
        if (success && objectUrl) {
          console.log('Opening object URL in new tab:', objectUrl);
          window.open(objectUrl, '_blank');
        } else {
          console.error('Failed to create object URL');
        }
      }
    } catch (err) {
      console.error('Error handling direct download:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`space-y-4 text-center p-4 ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
      <h3 className="text-lg font-medium">Image Loading Error</h3>
      
      <p className="text-sm text-gray-600">
        The image could not be loaded. {diagnosticInfo?.contentType === 'application/json' ? 
          'The server returned JSON instead of an image file.' : 
          'There was a problem with the image format or permissions.'}
      </p>
      
      <div className="flex flex-col gap-2 items-center">
        <Button 
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex items-center"
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Loading
        </Button>
        
        {isSupabaseUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDirect}
            className="flex items-center"
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Try Direct Download
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      {showDetails && (
        <div className="mt-4 text-xs text-left bg-gray-50 p-3 rounded border">
          <h4 className="font-bold mb-2">Diagnostic Information:</h4>
          <ul className="space-y-1">
            <li><b>URL:</b> {imageUrl.substring(0, 50)}...</li>
            <li><b>Is Supabase URL:</b> {isSupabaseUrl ? 'Yes' : 'No'}</li>
            {diagnosticInfo?.contentType && (
              <li><b>Content Type:</b> {diagnosticInfo.contentType}</li>
            )}
            {diagnosticInfo?.status && (
              <li><b>HTTP Status:</b> {diagnosticInfo.status}</li>
            )}
            {diagnosticInfo?.error && (
              <li><b>Error:</b> {diagnosticInfo.error}</li>
            )}
          </ul>
          
          <div className="mt-4 border-t pt-2">
            <h4 className="font-bold mb-2">Possible Solutions:</h4>
            <ul className="list-disc pl-4 space-y-1">
              {isSupabaseUrl && (
                <>
                  <li>Make sure the file exists in your Supabase storage bucket</li>
                  <li>Check that your storage bucket has public access enabled</li>
                  <li>Try adding <code>?download=true</code> to the URL</li>
                  <li>For future uploads, use <code>uploadImagePreservingFormat</code></li>
                </>
              )}
              {diagnosticInfo?.contentType === 'application/json' && (
                <>
                  <li>The server returned JSON instead of an image. This often happens when:
                    <ul className="pl-4 mt-1">
                      <li>The file doesn't exist</li>
                      <li>You don't have permission to access it</li>
                      <li>There's an error in the URL format</li>
                    </ul>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center text-xs text-blue-600 gap-1">
              <Shield className="h-3 w-3" />
              <span>Try the direct download button above to bypass the issue</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageErrorHandler;
