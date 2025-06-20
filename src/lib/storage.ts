import { SavedCourse } from './types';

const STORAGE_KEY = 'ai_courses_mvp';

export const storage = {
  getSavedCourses(): SavedCourse[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse saved courses:', error);
      return [];
    }
  },

  saveCourse(course: SavedCourse): void {
    if (typeof window === 'undefined') return;

    try {
      const courses = this.getSavedCourses();
      courses.unshift(course);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  },

  clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}; 