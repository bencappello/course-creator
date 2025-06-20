'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { generateImage } from '@/lib/api-client';

interface ImageWithFallbackProps {
  prompt: string;
  alt: string;
  className?: string;
  existingUrl?: string;
}

export function ImageWithFallback({ 
  prompt, 
  alt, 
  className = '', 
  existingUrl 
}: ImageWithFallbackProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(existingUrl || null);
  const [loading, setLoading] = useState(!existingUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!existingUrl && prompt) {
      generateImageFromPrompt();
    }
  }, [prompt, existingUrl]);

  const generateImageFromPrompt = async () => {
    try {
      setLoading(true);
      setError(false);
      const result = await generateImage(prompt);
      if (result.success && result.data) {
        setImageUrl(result.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ aspectRatio: '16/9' }}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`} style={{ aspectRatio: '16/9' }}>
        <ImageIcon className="h-16 w-16 text-gray-400 mb-3" />
        <p className="text-gray-500 text-sm text-center">Image generation unavailable</p>
        <button 
          onClick={generateImageFromPrompt}
          className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
} 