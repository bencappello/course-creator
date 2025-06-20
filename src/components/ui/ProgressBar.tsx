import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  className,
  showPercentage = false 
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={clsx('w-full', className)}>
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-center mt-2 text-sm text-gray-600 font-medium">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
} 