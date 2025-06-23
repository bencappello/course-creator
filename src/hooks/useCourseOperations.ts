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
      console.log('🔵 Starting outline generation...', { prompt, numModules, contentDepth });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_PROMPT', payload: prompt });
      dispatch({ type: 'SET_CONTENT_DEPTH', payload: contentDepth as ContentDepth });
      
      console.log('🔵 Calling API to generate outline...');
      const modules = await apiClient.generateOutline(prompt, numModules, contentDepth);
      console.log('🔵 Received modules from API:', modules);
      
      dispatch({ type: 'SET_OUTLINE', payload: modules });
      dispatch({ type: 'SET_STAGE', payload: 'outlineReview' });
      console.log('🔵 Set stage to outlineReview');
    } catch (error) {
      console.error('❌ Error generating outline:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate outline' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('🔵 Loading set to false');
    }
  }, [dispatch]);

  const generateFullCourse = useCallback(async () => {
    if (!state.courseOutline) return;

    try {
      console.log('🔵 Starting full course generation...', {
        outline: state.courseOutline,
        depth: state.contentDepth
      });
      
      dispatch({ type: 'SET_STAGE', payload: 'generatingCourse' });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🔵 Calling API to generate course...');
      const course = await apiClient.generateCourse(state.userPrompt, state.courseOutline, state.contentDepth);
      console.log('🔵 Received course from API:', course);
      console.log('🔵 Course cover imageUrl:', course.cover?.imageUrl);
      console.log('🔵 First slide imageUrl:', course.modules?.[0]?.slides?.[0]?.imageUrl);
      
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
      
      // Reload saved courses to update the sidebar
      const updatedCourses = storage.getSavedCourses();
      dispatch({ type: 'LOAD_SAVED_COURSES', payload: updatedCourses });
      
      dispatch({ type: 'SET_STAGE', payload: 'courseView' });
      console.log('🔵 Course generation complete!');
    } catch (error) {
      console.error('❌ Error generating course:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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