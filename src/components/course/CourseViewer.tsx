'use client';

import React, { useCallback } from 'react';
import { Course } from '@/lib/types';
import { useCourse } from '@/components/providers/CourseProvider';
import { SlideViewer } from './SlideViewer';
import { QuizComponent } from './QuizComponent';
import { CourseNavigator } from './CourseNavigator';
import { ImageWithFallback } from './ImageWithFallback';
import { Button } from '@/components/ui/Button';
import { Home, Download } from 'lucide-react';

interface CourseViewerProps {
  course: Course;
  onHome?: () => void;
}

export function CourseViewer({ course, onHome }: CourseViewerProps) {
  const { state, dispatch } = useCourse();
  
  // Get current state for this module
  const currentModuleIndex = state.currentSlide[0] || 0;
  const currentSlideIndex = state.currentSlide[currentModuleIndex] || 0;
  const viewMode = state.viewMode[currentModuleIndex] || 'slide';
  const quizScore = state.quizScores[currentModuleIndex];
  
  const currentModule = course.modules[currentModuleIndex];

  const handleModuleChange = useCallback((index: number) => {
    dispatch({ 
      type: 'SET_CURRENT_SLIDE', 
      payload: { moduleIndex: 0, slideIndex: index } 
    });
  }, [dispatch]);

  const handleSlideChange = useCallback((index: number) => {
    dispatch({ 
      type: 'SET_CURRENT_SLIDE', 
      payload: { moduleIndex: currentModuleIndex, slideIndex: index } 
    });
  }, [currentModuleIndex, dispatch]);

  const handleViewModeChange = useCallback((mode: 'slide' | 'quiz') => {
    dispatch({ 
      type: 'SET_VIEW_MODE', 
      payload: { moduleIndex: currentModuleIndex, mode } 
    });
  }, [currentModuleIndex, dispatch]);

  const handleQuizComplete = useCallback((score: { score: number; total: number }) => {
    dispatch({ 
      type: 'UPDATE_QUIZ_SCORE', 
      payload: { moduleIndex: currentModuleIndex, score } 
    });
  }, [currentModuleIndex, dispatch]);

  const handleDownload = () => {
    // Create a simple text version of the course
    const courseText = course.modules.map((module, mIndex) => {
      const moduleText = `Module ${mIndex + 1}: ${module.title}\n\n`;
      const slidesText = module.slides.map((slide, sIndex) => {
        return `Slide ${sIndex + 1}: ${slide.title}\n${slide.content.summary}\n`;
      }).join('\n');
      return moduleText + slidesText;
    }).join('\n\n');

    const blob = new Blob([courseText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-${course.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.prompt}</h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          {onHome && (
            <Button variant="secondary" size="sm" onClick={onHome}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Course Cover Image */}
      {course.cover && course.cover.image_prompt && (
        <div className="mb-8">
          <ImageWithFallback
            prompt={course.cover.image_prompt}
            alt="Course Cover"
            existingUrl={course.cover.imageUrl}
            className="w-full max-w-4xl mx-auto rounded-xl shadow-lg"
          />
        </div>
      )}

      {/* Course Content */}
      <div className="max-w-4xl mx-auto">
        {viewMode === 'slide' ? (
          <SlideViewer slide={currentModule.slides[currentSlideIndex]} />
        ) : (
          <QuizComponent
            questions={currentModule.quiz}
            onComplete={handleQuizComplete}
            previousScore={quizScore}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto mt-8">
        <CourseNavigator
          course={course}
          currentModuleIndex={currentModuleIndex}
          currentSlideIndex={currentSlideIndex}
          viewMode={viewMode}
          onModuleChange={handleModuleChange}
          onSlideChange={handleSlideChange}
          onViewModeChange={handleViewModeChange}
        />
      </div>
    </div>
  );
} 