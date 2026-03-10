
import { useState } from 'react';
import { useEdgeFunction } from '@/hooks/use-edge-function';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function EdgeFunctionExample() {
  const [name, setName] = useState('');
  const { invoke, isLoading, data, error } = useEdgeFunction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await invoke({
      functionName: 'hello-world',
      payload: { name: name || 'World' },
      onSuccess: (data) => {
        toast.success('Function invoked successfully');
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      }
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Edge Function Test</CardTitle>
        <CardDescription>
          Test the CORS-enabled Edge Function by submitting your name
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Invoke Function'}
          </Button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-md">
            Error: {error.message}
          </div>
        )}
        
        {data && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
            <p><strong>Response:</strong> {data.message}</p>
            <p><strong>Timestamp:</strong> {data.timestamp}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
