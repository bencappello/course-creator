'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AppAction } from '@/lib/types';
import { appReducer, initialState } from '@/lib/app-reducer';
import { storage } from '@/lib/storage';

interface CourseContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const CourseContext = createContext<CourseContextType | null>(null);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved courses on mount
  useEffect(() => {
    const savedCourses = storage.getSavedCourses();
    dispatch({ type: 'LOAD_SAVED_COURSES', payload: savedCourses });
  }, []);

  return (
    <CourseContext.Provider value={{ state, dispatch }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
} 