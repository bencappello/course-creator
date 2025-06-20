'use client';

import React from 'react';
import { Course, ViewMode } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, BookOpen, Brain } from 'lucide-react';

interface CourseNavigatorProps {
  course: Course;
  currentModuleIndex: number;
  currentSlideIndex: number;
  viewMode: ViewMode;
  onModuleChange: (index: number) => void;
  onSlideChange: (index: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function CourseNavigator({
  course,
  currentModuleIndex,
  currentSlideIndex,
  viewMode,
  onModuleChange,
  onSlideChange,
  onViewModeChange,
}: CourseNavigatorProps) {
  const currentModule = course.modules[currentModuleIndex];
  const totalSlides = currentModule.slides.length;
  const hasQuiz = currentModule.quiz && currentModule.quiz.length > 0;

  const handlePrevious = () => {
    if (viewMode === 'quiz' && currentSlideIndex === totalSlides - 1) {
      // Go back to last slide
      onViewModeChange('slide');
    } else if (currentSlideIndex > 0) {
      // Previous slide in current module
      onSlideChange(currentSlideIndex - 1);
    } else if (currentModuleIndex > 0) {
      // Last slide of previous module
      const prevModule = course.modules[currentModuleIndex - 1];
      onModuleChange(currentModuleIndex - 1);
      onSlideChange(prevModule.slides.length - 1);
      onViewModeChange('slide');
    }
  };

  const handleNext = () => {
    if (viewMode === 'slide' && currentSlideIndex === totalSlides - 1 && hasQuiz) {
      // Show quiz after last slide
      onViewModeChange('quiz');
    } else if (currentSlideIndex < totalSlides - 1) {
      // Next slide in current module
      onSlideChange(currentSlideIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      // First slide of next module
      onModuleChange(currentModuleIndex + 1);
      onSlideChange(0);
      onViewModeChange('slide');
    }
  };

  const isAtStart = currentModuleIndex === 0 && currentSlideIndex === 0 && viewMode === 'slide';
  const isAtEnd = currentModuleIndex === course.modules.length - 1 && 
                  ((viewMode === 'quiz') || 
                   (viewMode === 'slide' && currentSlideIndex === totalSlides - 1 && !hasQuiz));

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      {/* Module Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-600">Course Progress</h4>
          <span className="text-sm text-gray-500">
            Module {currentModuleIndex + 1} of {course.modules.length}
          </span>
        </div>
        
        <div className="flex gap-2">
          {course.modules.map((module, index) => (
            <button
              key={index}
              onClick={() => {
                onModuleChange(index);
                onSlideChange(0);
                onViewModeChange('slide');
              }}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index < currentModuleIndex
                  ? 'bg-indigo-600'
                  : index === currentModuleIndex
                  ? 'bg-indigo-400'
                  : 'bg-gray-300'
              }`}
              title={module.title}
            />
          ))}
        </div>
      </div>

      {/* Current Module Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {currentModule.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {viewMode === 'slide' ? `Slide ${currentSlideIndex + 1} of ${totalSlides}` : 'Quiz'}
          </span>
          {hasQuiz && (
            <button
              onClick={() => onViewModeChange(viewMode === 'slide' ? 'quiz' : 'slide')}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
            >
              <Brain className="h-4 w-4" />
              {viewMode === 'slide' ? 'Take Quiz' : 'Back to Slides'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={isAtStart}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentModule.slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                onSlideChange(index);
                onViewModeChange('slide');
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                viewMode === 'slide' && index === currentSlideIndex
                  ? 'bg-indigo-600'
                  : index < currentSlideIndex || viewMode === 'quiz'
                  ? 'bg-indigo-400'
                  : 'bg-gray-300'
              }`}
            />
          ))}
          {hasQuiz && (
            <button
              onClick={() => onViewModeChange('quiz')}
              className={`w-2 h-2 rounded-full transition-colors ${
                viewMode === 'quiz' ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={isAtEnd}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 