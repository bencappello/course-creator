'use client';

import React, { useState } from 'react';
import { Course } from '@/lib/types';
import { useCourse } from '@/components/providers/CourseProvider';
import { ModuleSlideNavigator } from './ModuleSlideNavigator';
import { ImageWithFallback } from './ImageWithFallback';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Home, Download } from 'lucide-react';

interface CourseViewerProps {
  course: Course;
  onHome?: () => void;
}

export function CourseViewer({ course, onHome }: CourseViewerProps) {
  const { state, dispatch } = useCourse();
  // Track which modules are expanded - first module starts expanded
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(
    Object.fromEntries(course.modules.map((_, index) => [index, index === 0]))
  );
  
  // Debug logging
  console.log('🎬 CourseViewer - Course data:', {
    courseId: course.id,
    moduleCount: course.modules.length,
    coverImage: {
      hasPrompt: !!course.cover?.image_prompt,
      hasUrl: !!course.cover?.imageUrl,
      imageUrl: course.cover?.imageUrl
    },
    firstSlide: {
      hasImageUrl: !!course.modules?.[0]?.slides?.[0]?.imageUrl,
      imageUrl: course.modules?.[0]?.slides?.[0]?.imageUrl
    }
  });
  
  const handleQuizComplete = (moduleIndex: number) => (score: { score: number; total: number }) => {
    dispatch({ 
      type: 'UPDATE_QUIZ_SCORE', 
      payload: { moduleIndex, score } 
    });
  };

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
            key={`cover-${course.id}-${course.cover.imageUrl}`} // Force re-render when course changes
            prompt={course.cover.image_prompt}
            alt="Course Cover"
            existingUrl={course.cover.imageUrl}
            className="w-64 h-64 mx-auto rounded-xl shadow-lg"
          />
        </div>
      )}

      {/* Modules with Slide Navigation */}
      <div className="max-w-4xl mx-auto space-y-12">
        {course.modules.map((module, moduleIndex) => (
          <Card key={moduleIndex} className="p-8">
            <ModuleSlideNavigator
              module={module}
              moduleIndex={moduleIndex}
              onQuizComplete={handleQuizComplete(moduleIndex)}
              previousScore={state.quizScores[moduleIndex]}
              isExpanded={expandedModules[moduleIndex]}
              onToggleExpand={() => setExpandedModules(prev => ({
                ...prev,
                [moduleIndex]: !prev[moduleIndex]
              }))}
            />
          </Card>
        ))}
      </div>
    </div>
  );
} 