
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface EdgeFunctionOptions<T> {
  functionName: string;
  payload?: T;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useEdgeFunction<T = Record<string, any>>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const invoke = async <T>({ functionName, payload, onSuccess, onError }: EdgeFunctionOptions<T>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Invoking edge function: ${functionName}`, payload);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });
      
      if (error) {
        console.error(`Edge function error (${functionName}):`, error);
        throw new Error(error.message || 'Unknown error occurred');
      }
      
      console.log(`Edge function response (${functionName}):`, data);
      setData(data);
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`Edge function exception (${functionName}):`, error);
      
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    invoke,
    isLoading,
    error,
    data,
  };
}
