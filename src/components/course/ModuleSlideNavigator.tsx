'use client';

import React, { useState } from 'react';
import { CourseModule } from '@/lib/types';
import { SlideViewer } from './SlideViewer';
import { QuizComponent } from './QuizComponent';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, BookOpen, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

interface ModuleSlideNavigatorProps {
  module: CourseModule;
  moduleIndex: number;
  onQuizComplete: (score: { score: number; total: number }) => void;
  previousScore?: { score: number; total: number };
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ModuleSlideNavigator({ 
  module, 
  moduleIndex,
  onQuizComplete,
  previousScore,
  isExpanded,
  onToggleExpand 
}: ModuleSlideNavigatorProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'slides' | 'quiz'>('slides');

  const handleNext = () => {
    if (currentSlideIndex < module.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleView = () => {
    setViewMode(viewMode === 'slides' ? 'quiz' : 'slides');
  };

  const hasQuiz = module.quiz && module.quiz.length > 0;
  const currentSlide = module.slides[currentSlideIndex];

  return (
    <div className="space-y-6">
      {/* Module Header with Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-start gap-2 flex-1">
          <button
            onClick={onToggleExpand}
            className="mt-1 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">
              Module {moduleIndex + 1}: {module.title}
            </h2>
            {module.description && (
              <p className="text-gray-600 mt-1">{module.description}</p>
            )}
          </div>
        </div>
        
        {hasQuiz && isExpanded && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={toggleView}
            className="flex items-center gap-2"
          >
            {viewMode === 'slides' ? (
              <>
                <ClipboardList className="h-4 w-4" />
                View Quiz
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                View Slides
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content Area - Only shown when expanded */}
      {isExpanded && (
        <>
          {viewMode === 'slides' ? (
            <>
              {/* Slide Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {module.slides.map((_slide, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentSlideIndex
                        ? 'bg-indigo-600 w-8'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Current Slide */}
              <div className="bg-gray-50 rounded-xl p-8">
                <SlideViewer slide={currentSlide} />
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={currentSlideIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-gray-500">
                  Slide {currentSlideIndex + 1} of {module.slides.length}
                </span>

                <Button
                  variant="secondary"
                  onClick={handleNext}
                  disabled={currentSlideIndex === module.slides.length - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            /* Quiz View */
            <div className="bg-gray-50 rounded-xl p-8">
              <QuizComponent
                questions={module.quiz || []}
                onComplete={onQuizComplete}
                previousScore={previousScore}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 