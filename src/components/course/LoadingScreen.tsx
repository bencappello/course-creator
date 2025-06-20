'use client';

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export function LoadingScreen({ message = 'Loading...', progress }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <LoadingSpinner size="lg" />
      <p className="text-lg text-gray-600 mt-6 font-medium">{message}</p>
      {progress !== undefined && progress > 0 && (
        <div className="w-full max-w-md mt-8">
          <ProgressBar progress={progress} showPercentage />
        </div>
      )}
    </div>
  );
} 