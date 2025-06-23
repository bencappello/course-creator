import { useCallback } from 'react';
import { useCourse } from '@/components/providers/CourseProvider';
import { storage } from '@/lib/storage';
import { apiClient } from '@/lib/api-client';
import { Course } from '@/lib/types';

export function useCourses() {
  const { state, dispatch } = useCourse();

  const loadCourse = useCallback(async (courseId: number) => {
    const courseToLoad = state.savedCourses.find(c => c.id === courseId);
    if (!courseToLoad) {
      throw new Error('Course not found');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_PROGRESS', payload: { progress: 0, message: 'Loading course...' } });

    try {
      dispatch({ type: 'SET_PROMPT', payload: courseToLoad.prompt });
      dispatch({ type: 'SET_CONTENT_DEPTH', payload: courseToLoad.depth });

      // Create a full course object from the saved course
      const fullCourse: Course = {
        id: courseId.toString(),
        ...courseToLoad.course,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check if images need to be regenerated
      let needsImageGeneration = false;
      
      // Check cover image
      if (!fullCourse.cover.imageUrl || fullCourse.cover.imageUrl === '') {
        needsImageGeneration = true;
      }
      
      // Check module images
      for (const courseModule of fullCourse.modules) {
        for (const slide of courseModule.slides) {
          if (!slide.imageUrl || slide.imageUrl === '') {
            needsImageGeneration = true;
            break;
          }
        }
        if (needsImageGeneration) break;
      }

      // Only regenerate images if needed
      if (needsImageGeneration) {
        console.log('⚠️ Some images are missing, regenerating...');
        
      // Calculate total steps for progress tracking
        let totalSteps = 0;
        if (!fullCourse.cover.imageUrl) totalSteps++;
      fullCourse.modules.forEach(m => {
          m.slides.forEach(s => {
            if (!s.imageUrl) totalSteps++;
          });
      });
      
      let completedSteps = 0;
      const updateProgress = (message: string) => {
        completedSteps++;
        dispatch({ 
          type: 'SET_PROGRESS', 
          payload: { 
            progress: (completedSteps / totalSteps) * 100, 
            message 
          } 
        });
      };

        // Regenerate missing images only
        if (!fullCourse.cover.imageUrl) {
      updateProgress('Generating cover image...');
      fullCourse.cover.imageUrl = await apiClient.generateImage(fullCourse.cover.image_prompt);
        }

      for (const courseModule of fullCourse.modules) {
        for (const slide of courseModule.slides) {
            if (!slide.imageUrl) {
          updateProgress(`Generating images for ${courseModule.title}...`);
          slide.imageUrl = await apiClient.generateImage(slide.image_prompt);
        }
          }
        }
        
        // Save the updated course with new image URLs
        const updatedSavedCourse = {
          ...courseToLoad,
          course: {
            prompt: fullCourse.prompt,
            depth: fullCourse.depth,
            cover: fullCourse.cover,
            modules: fullCourse.modules
          }
        };
        
        // Update in storage
        const allCourses = storage.getSavedCourses();
        const updatedCourses = allCourses.map(c => 
          c.id === courseId ? updatedSavedCourse : c
        );
        storage.clearHistory();
        updatedCourses.forEach(course => storage.saveCourse(course));
      } else {
        console.log('✅ All images found in storage, loading directly from S3');
        dispatch({ 
          type: 'SET_PROGRESS', 
          payload: { 
            progress: 100, 
            message: 'Course loaded successfully!' 
          } 
        });
      }

      dispatch({ type: 'SET_COURSE', payload: fullCourse });
      
      // Initialize viewing state
      fullCourse.modules.forEach((_, index) => {
        dispatch({ type: 'SET_CURRENT_SLIDE', payload: { moduleIndex: index, slideIndex: 0 } });
        dispatch({ type: 'SET_VIEW_MODE', payload: { moduleIndex: index, mode: 'slide' } });
      });
      
      dispatch({ type: 'SET_STAGE', payload: 'courseView' });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load course. Please try again.' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.savedCourses, dispatch]);

  const deleteCourse = useCallback((courseId: number) => {
    const updatedCourses = state.savedCourses.filter(c => c.id !== courseId);
    storage.clearHistory();
    updatedCourses.forEach(course => {
      storage.saveCourse(course);
    });
    dispatch({ type: 'LOAD_SAVED_COURSES', payload: updatedCourses });
  }, [state.savedCourses, dispatch]);

  const clearAllCourses = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all your saved courses? This cannot be undone.')) {
      storage.clearHistory();
      dispatch({ type: 'LOAD_SAVED_COURSES', payload: [] });
    }
  }, [dispatch]);

  return {
    savedCourses: state.savedCourses,
    loadCourse,
    deleteCourse,
    clearAllCourses
  };
} 