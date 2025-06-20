import { useCallback } from 'react';
import { useCourse } from '@/components/providers/CourseProvider';
import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';
import { SavedCourse, ContentDepth } from '@/lib/types';

export function useCourseOperations() {
  const { state, dispatch } = useCourse();

  const generateOutline = useCallback(async (
    prompt: string, 
    numModules: number, 
    contentDepth: string
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_PROMPT', payload: prompt });
      dispatch({ type: 'SET_CONTENT_DEPTH', payload: contentDepth as ContentDepth });
      
      const modules = await apiClient.generateOutline(prompt, numModules);
      dispatch({ type: 'SET_OUTLINE', payload: modules });
      dispatch({ type: 'SET_STAGE', payload: 'outlineReview' });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate outline' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const generateFullCourse = useCallback(async () => {
    if (!state.courseOutline) return;

    try {
      dispatch({ type: 'SET_STAGE', payload: 'generatingCourse' });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const course = await apiClient.generateCourse(state.userPrompt, state.courseOutline);
      dispatch({ type: 'SET_COURSE', payload: course });
      
      // Initialize course state
      course.modules.forEach((_, index) => {
        dispatch({ type: 'SET_CURRENT_SLIDE', payload: { moduleIndex: index, slideIndex: 0 } });
        dispatch({ type: 'SET_VIEW_MODE', payload: { moduleIndex: index, mode: 'slide' } });
      });

      // Save course
      const savedCourse: SavedCourse = {
        id: Date.now(),
        prompt: state.userPrompt,
        depth: state.contentDepth,
        course: {
          prompt: course.prompt,
          depth: course.depth,
          cover: course.cover,
          modules: course.modules
        }
      };
      storage.saveCourse(savedCourse);
      
      dispatch({ type: 'SET_STAGE', payload: 'courseView' });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.courseOutline, state.userPrompt, state.contentDepth, dispatch]);

  const resetToPrompt = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_STAGE', payload: 'prompt' });
  }, [dispatch]);

  return {
    generateOutline,
    generateFullCourse,
    resetToPrompt
  };
} 