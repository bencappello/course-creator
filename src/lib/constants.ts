export const APP_NAME = 'Agentic Course Designer';
export const APP_DESCRIPTION = 'Your personal AI-powered learning architect.';

export const CONTENT_DEPTH_OPTIONS = [
  { value: 'Low', label: 'Low (Concise)' },
  { value: 'Medium', label: 'Medium (Detailed)' },
  { value: 'High', label: 'High (Comprehensive)' }
] as const;

export const MODULE_COUNT_OPTIONS = [
  { value: 1, label: '1 Module (Quick Start)' },
  { value: 2, label: '2 Modules (Standard)' },
  { value: 3, label: '3 Modules (Deep Dive)' }
] as const;

export const DEFAULT_CONTENT_DEPTH = 'Low';
export const DEFAULT_MODULE_COUNT = 3;

export const STORAGE_KEY = 'ai_courses_mvp';

export const API_ENDPOINTS = {
  GENERATE_OUTLINE: '/api/generate-outline',
  GENERATE_COURSE: '/api/generate-course',
  GENERATE_IMAGE: '/api/generate-image'
} as const; 