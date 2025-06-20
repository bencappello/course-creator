import { useState, useCallback } from 'react';

interface ProgressState {
  progress: number;
  message: string;
  isComplete: boolean;
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>({
    progress: 0,
    message: '',
    isComplete: false,
  });

  const updateProgress = useCallback((progress: number, message: string = '') => {
    setState({
      progress: Math.min(Math.max(progress, 0), 100),
      message,
      isComplete: progress >= 100,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      progress: 0,
      message: '',
      isComplete: false,
    });
  }, []);

  const complete = useCallback((message: string = 'Complete!') => {
    setState({
      progress: 100,
      message,
      isComplete: true,
    });
  }, []);

  return {
    progress: state.progress,
    message: state.message,
    isComplete: state.isComplete,
    updateProgress,
    reset,
    complete,
  };
} 