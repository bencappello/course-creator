'use client';

import React from 'react';
import { Slide } from '@/lib/types';
import { ImageWithFallback } from './ImageWithFallback';
import { useCourse } from '@/components/providers/CourseProvider';

interface SlideViewerProps {
  slide: Slide;
}

export function SlideViewer({ slide }: SlideViewerProps) {
  const { state } = useCourse();
  const depth = state.contentDepth;

  // Debug logging
  console.log('📄 SlideViewer rendering:', {
    slideTitle: slide.title,
    hasImagePrompt: !!slide.image_prompt,
    imagePrompt: slide.image_prompt?.substring(0, 50) + '...',
    hasExistingUrl: !!slide.imageUrl,
    existingUrl: slide.imageUrl
  });

  // Determine which content to show based on depth
  const getContent = () => {
    switch (depth) {
      case 'Low':
        return [slide.content.summary];
      case 'Medium':
        return [slide.content.summary, ...slide.content.details];
      case 'High':
        return [slide.content.summary, ...slide.content.details, ...slide.content.deep_dive];
      default:
        return [slide.content.summary];
    }
  };

  const contentItems = getContent();

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">{slide.title}</h3>
      
      <div className="prose prose-lg max-w-none space-y-4">
        {contentItems.map((item, index) => (
          <p key={index} className="text-gray-700 leading-relaxed">
            {item}
          </p>
        ))}
      </div>

      {slide.image_prompt && (
        <div className="mt-8">
          <ImageWithFallback
            prompt={slide.image_prompt}
            alt={slide.title}
            existingUrl={slide.imageUrl}
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
} 