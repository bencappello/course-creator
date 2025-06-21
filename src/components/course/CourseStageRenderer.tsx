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

  // Debug logging
  console.log('🟢 CourseStageRenderer - Current state:', {
    currentStage: state.currentStage,
    loading: state.loading,
    error: state.error,
    hasOutline: !!state.courseOutline,
    outlineLength: state.courseOutline?.length || 0
  });

  // Handle error state
  if (state.error) {
    return <ErrorScreen message={state.error} onRetry={resetToPrompt} />;
  }

  // Handle loading state for generating course
  if (state.currentStage === 'generatingCourse' || (state.loading && state.currentStage !== 'prompt')) {
    console.log('🟢 Showing loading screen');
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
      console.log('🟢 Rendering PromptForm');
      return <PromptForm />;
    
    case 'outlineReview':
      console.log('🟢 Rendering OutlineReview');
      return <OutlineReview />;
    
    case 'courseView':
      if (!state.fullCourse) {
        console.log('🟢 No full course, falling back to PromptForm');
        return <PromptForm />; // Fallback if no course
      }
      console.log('🟢 Rendering CourseViewer');
      return (
        <CourseViewer 
          course={state.fullCourse} 
          onHome={resetToPrompt}
        />
      );
    
    default:
      console.log('🟢 Default case, rendering PromptForm');
      return <PromptForm />;
  }
} 