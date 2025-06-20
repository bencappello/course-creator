'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCourses } from '@/hooks/useCourses';
import { truncateText } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewCourse: () => void;
}

export function Sidebar({ isOpen, onClose, onNewCourse }: SidebarProps) {
  const { savedCourses, loadCourse, deleteCourse, clearAllCourses } = useCourses();

  const handleCourseClick = async (courseId: number) => {
    try {
      await loadCourse(courseId);
      onClose();
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed top-0 left-0 w-full h-full bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 w-80 h-full bg-white shadow-2xl z-50 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={onNewCourse}
            >
              New
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-8rem)]">
          {savedCourses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No saved courses yet. Create your first course!
            </p>
          ) : (
            savedCourses.map((course) => (
              <div
                key={course.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                onClick={() => handleCourseClick(course.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {truncateText(course.prompt, 50)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.course.modules.length} modules • {course.depth} depth
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCourse(course.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={clearAllCourses}
            disabled={savedCourses.length === 0}
          >
            Clear History
          </Button>
        </div>
      </div>
    </>
  );
} 