'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useCourse } from '@/components/providers/CourseProvider';
import { useCourseOperations } from '@/hooks/useCourseOperations';
import { CheckCircle } from 'lucide-react';

export function OutlineReview() {
  const { state } = useCourse();
  const { generateFullCourse, resetToPrompt } = useCourseOperations();
  
  if (!state.courseOutline) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Your Course Outline</h2>
        <p className="text-gray-500">
          We&apos;ve created a structured outline for your course. Review and proceed to generate full content.
        </p>
      </div>

      <div className="space-y-4">
        {state.courseOutline.map((module, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
          >
            <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">
                Module {index + 1}: {module.title}
              </h3>
              {module.description && (
                <p className="text-gray-600 mt-1">{module.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center pt-6">
        <Button 
          variant="secondary"
          onClick={resetToPrompt}
        >
          Start Over
        </Button>
        <Button 
          onClick={generateFullCourse}
          disabled={state.loading}
        >
          Generate Full Course
        </Button>
      </div>
    </div>
  );
} 