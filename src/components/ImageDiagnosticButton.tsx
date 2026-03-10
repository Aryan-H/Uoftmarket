import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, RefreshCw, FileType } from 'lucide-react';
import { createObjectUrlFromImageUrl, testImageUrl, testImageProperties } from '@/utils/imageUtils';
import { getDirectDownloadUrl } from '@/utils/supabaseImageUtils';
interface ImageDiagnosticButtonProps {
  imageUrl: string;
  className?: string;
}
const ImageDiagnosticButton = ({
  imageUrl,
  className = ''
}: ImageDiagnosticButtonProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const runDiagnostics = async () => {
    if (!imageUrl || isRunning) return;
    setIsRunning(true);
    setTestComplete(false);
    setShowResults(true);
    try {
      console.log('====== STARTING COMPREHENSIVE IMAGE DIAGNOSTICS ======');
      console.log(`Image URL: ${imageUrl}`);

      // First try to get a direct download URL if it's a Supabase URL
      let urlToTest = imageUrl;
      if (imageUrl.includes('supabase.co/storage')) {
        const directUrl = await getDirectDownloadUrl(imageUrl, true);
        if (directUrl) {
          console.log('Using direct download URL for diagnostics:', directUrl);
          urlToTest = directUrl;
        }
      }

      // Manually run a comprehensive test
      const results: any = {
        fetchTest: {
          success: false,
          error: "Test not run"
        },
        imageObjectTest: {
          success: false,
          error: "Test not run"
        },
        objectUrlTest: {
          objectUrl: null,
          error: null
        }
      };

      // Test 1: Direct fetch test
      try {
        console.log("Step 1: Testing direct fetch...");
        const testResult = await testImageUrl(urlToTest);
        results.fetchTest = testResult;
        if (testResult.success) {
          console.log(`Fetch successful, content type: ${testResult.contentType}, size: ${testResult.blobSize}`);
        } else {
          console.error("Fetch test failed:", testResult.error);
        }
      } catch (error) {
        results.fetchTest.error = error instanceof Error ? error.message : String(error);
        console.error("Fetch test failed:", results.fetchTest.error);
      }

      // Test 2: Create object URL and test image loading
      try {
        console.log("Step 2: Testing object URL creation...");
        const {
          objectUrl,
          error
        } = await createObjectUrlFromImageUrl(urlToTest);
        results.objectUrlTest = {
          objectUrl,
          error
        };
        if (objectUrl) {
          console.log("Object URL created successfully");
        } else {
          console.error("Object URL creation failed:", error);
        }
      } catch (error) {
        results.objectUrlTest.error = error instanceof Error ? error.message : String(error);
        console.error("Object URL test failed:", results.objectUrlTest.error);
      }

      // Test 3: Check image dimensions and format
      if (results.objectUrlTest.objectUrl) {
        try {
          console.log("Step 3: Testing image properties...");
          const imageProps = await testImageProperties(results.objectUrlTest.objectUrl);
          results.imageObjectTest = {
            ...results.imageObjectTest,
            ...imageProps
          };
          if (imageProps.success) {
            console.log(`Image properties: ${imageProps.width}×${imageProps.height}, format: ${imageProps.originalFormat || 'unknown'}`);
          } else {
            console.error("Image properties test failed:", imageProps.error);
          }
        } catch (error) {
          results.imageObjectTest.success = false;
          results.imageObjectTest.error = error instanceof Error ? error.message : String(error);
          console.error("Image properties test failed:", results.imageObjectTest.error);
        }
      }
      setDiagnosticResults(results);
      console.log('====== COMPLETED IMAGE DIAGNOSTICS ======');
      console.log('Check the console for detailed results');
    } catch (error) {
      console.error('Error running image diagnostics:', error);
      setDiagnosticResults({
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRunning(false);
      setTestComplete(true);
    }
  };
  const hasError = diagnosticResults?.fetchTest?.success === false || diagnosticResults?.imageObjectTest?.success === false || diagnosticResults?.objectUrlTest?.objectUrl === null;
  const isSuccess = diagnosticResults?.fetchTest?.success === true && diagnosticResults?.imageObjectTest?.success === true && diagnosticResults?.objectUrlTest?.objectUrl !== null;

  // Extract image format information
  const getImageFormat = () => {
    const contentType = diagnosticResults?.fetchTest?.contentType || '';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'JPEG';
    if (contentType.includes('png')) return 'PNG';
    if (contentType.includes('webp')) return 'WebP';
    if (contentType.includes('gif')) return 'GIF';
    if (contentType.includes('svg')) return 'SVG';
    if (contentType.includes('json')) return 'JSON';
    if (contentType) return contentType.split('/')[1]?.toUpperCase() || 'Unknown';
    return 'Unknown';
  };
  return <div className="space-y-2">
      
      
      {showResults && <div className="mt-2 space-y-2">
          {isRunning && <Alert className="bg-gray-100 border-gray-200">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
              <AlertTitle>Running image diagnostics...</AlertTitle>
              <AlertDescription>
                Testing image URL accessibility and format.
              </AlertDescription>
            </Alert>}
          
          {testComplete && <>
              <Alert variant={hasError ? "destructive" : "default"} className={isSuccess ? "bg-green-50 border-green-200" : ""}>
                {hasError ? <AlertCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                <AlertTitle>{hasError ? "Image Loading Issues Detected" : "Image Diagnostic Results"}</AlertTitle>
                <AlertDescription className="mt-2">
                  {diagnosticResults ? <div className="text-xs space-y-1">
                      <div className="font-medium text-sm">
                        Image Format: <span className="text-indigo-600">{getImageFormat()}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Direct fetch:</span> {diagnosticResults.fetchTest?.success ? <span className="text-green-600">Success</span> : <span className="text-red-600">Failed - {diagnosticResults.fetchTest?.error || `Status: ${diagnosticResults.fetchTest?.status}`}</span>}
                      </div>
                      
                      <div>
                        <span className="font-medium">Image object test:</span> {diagnosticResults.imageObjectTest?.success ? <span className="text-green-600">Success</span> : <span className="text-red-600">Failed - {diagnosticResults.imageObjectTest?.error}</span>}
                      </div>
                      
                      <div>
                        <span className="font-medium">Object URL creation:</span> {diagnosticResults.objectUrlTest?.objectUrl ? <span className="text-green-600">Success</span> : <span className="text-red-600">Failed - {diagnosticResults.objectUrlTest?.error}</span>}
                      </div>
                      
                      {diagnosticResults.fetchTest?.contentType && <div>
                          <span className="font-medium">Content type:</span> {diagnosticResults.fetchTest.contentType}
                        </div>}
                      
                      {diagnosticResults.fetchTest?.blobSize && <div>
                          <span className="font-medium">Size:</span> {(diagnosticResults.fetchTest.blobSize / 1024).toFixed(2)} KB
                        </div>}
                      
                      {diagnosticResults.imageObjectTest?.width && diagnosticResults.imageObjectTest?.height && <div>
                          <span className="font-medium">Dimensions:</span> {diagnosticResults.imageObjectTest.width}×{diagnosticResults.imageObjectTest.height}
                        </div>}
                      
                      {diagnosticResults.imageObjectTest?.originalFormat && <div>
                          <span className="font-medium">Original format:</span> {diagnosticResults.imageObjectTest.originalFormat}
                        </div>}
                    </div> : <p>No diagnostic data available</p>}
                </AlertDescription>
              </Alert>
              
              {hasError && <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  <AlertTitle>Image Format Issues</AlertTitle>
                  <AlertDescription className="mt-2">
                    <ul className="text-xs list-disc pl-4 space-y-1">
                      <li>Original format may have been transformed during upload or download</li>
                      <li>Supabase may be transforming your image when it shouldn't be</li>
                      <li>Try uploading with the new <code>uploadImagePreservingFormat</code> function</li>
                      <li>Ensure your bucket has proper download permissions</li>
                    </ul>
                  </AlertDescription>
                </Alert>}
            </>}
          
          <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="text-xs mt-1">
            Hide results
          </Button>
        </div>}
    </div>;
};
export default ImageDiagnosticButton;