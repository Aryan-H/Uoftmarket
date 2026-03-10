
import { AlertTriangle, RefreshCw, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageErrorDisplayProps {
  imageUrl: string;
  isSupabaseUrl: boolean;
  showDiagnostics: boolean;
  diagnosticInfo: any;
  toggleDiagnostics: () => void;
  handleRetry: () => void;
  handleDownloadImage: () => void;
}

const ImageErrorDisplay = ({
  imageUrl,
  isSupabaseUrl,
  showDiagnostics,
  diagnosticInfo,
  toggleDiagnostics,
  handleRetry,
  handleDownloadImage
}: ImageErrorDisplayProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded-md p-4 text-center">
      <div className="mb-2 text-yellow-500">
        <AlertTriangle size={32} />
      </div>
      
      <h4 className="text-sm font-medium mb-2">Image failed to load</h4>
      
      <div className="flex space-x-2 mb-4">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRetry} 
          className="flex items-center text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
        
        {isSupabaseUrl && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDownloadImage} 
            className="flex items-center text-xs"
          >
            <Download className="h-3 w-3 mr-1" /> Direct Download
          </Button>
        )}
      </div>
      
      <div className="w-full">
        <Button 
          variant="ghost"
          size="sm"
          onClick={toggleDiagnostics}
          className="flex items-center justify-between text-xs w-full border-t pt-2"
        >
          <span>Technical Details</span>
          {showDiagnostics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        
        {showDiagnostics && diagnosticInfo && (
          <div className="mt-2 text-left text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-40">
            <p className="font-mono break-all mb-1">URL: {imageUrl}</p>
            {diagnosticInfo.status && <p>Status: {diagnosticInfo.status}</p>}
            {diagnosticInfo.contentType && <p>Content-Type: {diagnosticInfo.contentType}</p>}
            
            {diagnosticInfo.jsonResponse && (
              <pre className="text-xs overflow-auto mt-1 p-1 bg-gray-200 rounded">
                {JSON.stringify(diagnosticInfo.jsonResponse, null, 2)}
              </pre>
            )}
            
            {diagnosticInfo.textResponse && (
              <div className="mt-1">
                <p>Response preview:</p>
                <pre className="text-xs overflow-auto p-1 bg-gray-200 rounded">
                  {diagnosticInfo.textResponse}
                </pre>
              </div>
            )}
            
            {diagnosticInfo.error && (
              <p className="text-red-500 mt-1">Error: {diagnosticInfo.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageErrorDisplay;
