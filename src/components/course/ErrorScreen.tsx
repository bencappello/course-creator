'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="text-center bg-red-50 p-8 rounded-xl border border-red-200">
      <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-red-700 mb-2">An Error Occurred</h3>
      <p className="text-red-600 mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  );
} 