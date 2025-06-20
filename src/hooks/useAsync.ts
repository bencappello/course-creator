import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  // Keep track of if the component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>) => {
      setState({
        loading: true,
        error: null,
        data: null,
      });

      try {
        const result = await asyncFunction();
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            loading: false,
            error: null,
            data: result,
          });
        }
        
        return result;
      } catch (error) {
        const errorObject = error instanceof Error ? error : new Error(String(error));
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            loading: false,
            error: errorObject,
            data: null,
          });
        }
        
        throw errorObject;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
} 