'use client';

import React from 'react';
import { useCourse } from '@/components/providers/CourseProvider';
import { PromptForm } from './PromptForm';
import { OutlineReview } from './OutlineReview';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
import { CourseViewer } from './CourseViewer';
import { useCourseOperations } from '@/hooks/useCourseOperations';

export function CourseStageRenderer() {
  const { state } = useCourse();
  const { resetToPrompt } = useCourseOperations();

  // Handle error state
  if (state.error) {
    return <ErrorScreen message={state.error} onRetry={resetToPrompt} />;
  }

  // Handle loading state for generating course
  if (state.currentStage === 'generatingCourse' || (state.loading && state.currentStage !== 'prompt')) {
    return (
      <LoadingScreen 
        message={state.progressMessage || 'Generating your course...'} 
        progress={state.progress}
      />
    );
  }

  // Render based on current stage
  switch (state.currentStage) {
    case 'prompt':
      return <PromptForm />;
    
    case 'outlineReview':
      return <OutlineReview />;
    
    case 'courseView':
      if (!state.fullCourse) {
        return <PromptForm />; // Fallback if no course
      }
      return (
        <CourseViewer 
          course={state.fullCourse} 
          onHome={resetToPrompt}
        />
      );
    
    default:
      return <PromptForm />;
  }
} 