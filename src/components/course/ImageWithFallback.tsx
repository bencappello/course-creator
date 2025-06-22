'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api-client';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generateImageFromPrompt = useCallback(async () => {
    try {
      console.log('🖼️ Generating image for prompt:', prompt.substring(0, 50) + '...');
      setLoading(true);
      setError(false);
      
      const url = await apiClient.generateImage(prompt);
      console.log('🖼️ Generated image URL:', url);
      
      if (url) {
        setImageUrl(url);
      } else {
        console.error('🖼️ No URL returned from image generation');
        setError(true);
      }
    } catch (err) {
      console.error('🖼️ Failed to generate image:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  useEffect(() => {
    // Only generate if we don't have an existing URL and it's not already loading
    if (!existingUrl && !imageUrl && prompt && !loading && !error) {
      console.log('🖼️ ImageWithFallback: No existing URL, will generate image');
      generateImageFromPrompt();
    } else if (existingUrl) {
      console.log('🖼️ ImageWithFallback: Using existing URL:', existingUrl);
    }
  }, [prompt, existingUrl, imageUrl, loading, error, generateImageFromPrompt]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ aspectRatio: '1/1' }}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`} style={{ aspectRatio: '1/1' }}>
        <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500 text-sm text-center">
          {existingUrl ? 'Image unavailable' : 'Image generation failed'}
        </p>
        {!existingUrl && (
          <button 
            onClick={generateImageFromPrompt}
            className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <Image 
      src={imageUrl} 
      alt={alt} 
      width={256}
      height={256}
      className={className}
      onError={() => {
        console.error('🖼️ Image failed to load:', imageUrl);
        setError(true);
      }}
      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
    />
  );
} 