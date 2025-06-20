'use client';

import React from 'react';
import { useCourse } from '@/components/providers/CourseProvider';
import { PromptForm } from './PromptForm';
import { OutlineReview } from './OutlineReview';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
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
      // This will be implemented in the next phase
      return (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800">Course Viewer Coming Soon!</h2>
          <p className="text-gray-600 mt-2">The course viewing functionality will be implemented in the next phase.</p>
        </div>
      );
    
    default:
      return <PromptForm />;
  }
} 