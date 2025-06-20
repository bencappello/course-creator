# AI Course Designer - Next.js Migration Guide

## Overview

This guide provides detailed step-by-step instructions for migrating the AI Course Designer from a single HTML file to a modern Next.js application. Each phase builds upon the previous one, ensuring a systematic and reliable migration process.

## Prerequisites

- Node.js 18+ installed
- Basic knowledge of React and TypeScript
- Understanding of Next.js App Router
- Google AI API keys (Gemini and Imagen)

## Migration Phases

---

## Phase 1: Project Setup & Foundation

### Step 1: Initialize Next.js Project

```bash
# Create new Next.js project with TypeScript and Tailwind
npx create-next-app@latest course-designer --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd course-designer
```

### Step 2: Install Additional Dependencies

```bash
# Install additional packages for state management and utilities
npm install clsx tailwind-merge lucide-react
npm install -D @types/node
```

### Step 3: Configure Environment Variables

Create `.env.local`:
```bash
# Google AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
IMAGEN_API_KEY=your_imagen_api_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME="Agentic Course Designer"
```

### Step 4: Update Tailwind Configuration

Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
export default config
```

---

## Phase 2: Core Infrastructure

### Step 5: Create TypeScript Type Definitions

Create `src/lib/types.ts`:
```typescript
export type ContentDepth = 'Low' | 'Medium' | 'High';
export type CourseStage = 'prompt' | 'outlineReview' | 'generatingCourse' | 'courseView';
export type ViewMode = 'slide' | 'quiz';

export interface Course {
  id: string;
  prompt: string;
  depth: ContentDepth;
  cover: {
    imageUrl: string;
    image_prompt: string;
  };
  modules: CourseModule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseModule {
  title: string;
  description?: string;
  slides: Slide[];
  quiz: QuizQuestion[];
}

export interface Slide {
  title: string;
  image_prompt: string;
  imageUrl?: string;
  content: {
    summary: string;
    details: string[];
    deep_dive: string[];
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface QuizScore {
  score: number;
  total: number;
}

export interface SavedCourse {
  id: number;
  prompt: string;
  depth: ContentDepth;
  course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface AppState {
  currentStage: CourseStage;
  userPrompt: string;
  courseOutline: CourseModule[] | null;
  fullCourse: Course | null;
  quizScores: Record<number, QuizScore>;
  currentSlide: Record<number, number>;
  viewMode: Record<number, ViewMode>;
  savedCourses: SavedCourse[];
  contentDepth: ContentDepth;
  loading: boolean;
  error: string | null;
  progress: number;
  progressMessage: string;
}

export type AppAction = 
  | { type: 'SET_STAGE'; payload: CourseStage }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_OUTLINE'; payload: CourseModule[] }
  | { type: 'SET_COURSE'; payload: Course }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: { progress: number; message: string } }
  | { type: 'UPDATE_QUIZ_SCORE'; payload: { moduleIndex: number; score: QuizScore } }
  | { type: 'SET_CURRENT_SLIDE'; payload: { moduleIndex: number; slideIndex: number } }
  | { type: 'SET_VIEW_MODE'; payload: { moduleIndex: number; mode: ViewMode } }
  | { type: 'LOAD_SAVED_COURSES'; payload: SavedCourse[] }
  | { type: 'RESET_STATE' };
```

### Step 6: Create API Client Utilities

Create `src/lib/api-client.ts`:
```typescript
interface GeminiRequestOptions {
  prompt: string;
  schema?: any;
}

interface ImageGenerationOptions {
  prompt: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async generateOutline(prompt: string, numModules: number): Promise<CourseModule[]> {
    const response = await fetch(`${this.baseUrl}/api/generate-outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, numModules }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate outline: ${response.statusText}`);
    }

    const data = await response.json();
    return data.modules;
  }

  async generateCourse(prompt: string, outline: CourseModule[]): Promise<Course> {
    const response = await fetch(`${this.baseUrl}/api/generate-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, outline }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate course: ${response.statusText}`);
    }

    return response.json();
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  }
}

export const apiClient = new ApiClient();
```

### Step 7: Create Local Storage Utilities

Create `src/lib/storage.ts`:
```typescript
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
```

### Step 8: Create API Routes

Create `src/app/api/generate-outline/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { prompt, numModules } = await request.json();

    const outlineSchema = {
      type: "OBJECT",
      properties: {
        modules: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["modules"]
    };

    const outlinePrompt = `You are an expert instructional designer. A user wants a course on: "${prompt}". Generate a course outline with exactly ${numModules} module titles and a one-sentence description for each. Focus on a logical progression for a beginner. Output ONLY in the specified JSON format.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: outlinePrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: outlineSchema
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content generated');
    }

    const parsedContent = JSON.parse(content);
    return NextResponse.json(parsedContent);

  } catch (error) {
    console.error('Outline generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate outline' },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/generate-image/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const response = await fetch(`${IMAGEN_API_URL}?key=${process.env.IMAGEN_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }
      })
    });

    if (!response.ok) {
      throw new Error(`Imagen API error: ${response.statusText}`);
    }

    const result = await response.json();
    const imageData = result.predictions?.[0]?.bytesBase64Encoded;
    
    if (!imageData) {
      throw new Error('No image data generated');
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageData}`
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: State Management & Custom Hooks

### Step 9: Create App State Reducer

Create `src/lib/app-reducer.ts`:
```typescript
import { AppState, AppAction } from './types';

export const initialState: AppState = {
  currentStage: 'prompt',
  userPrompt: '',
  courseOutline: null,
  fullCourse: null,
  quizScores: {},
  currentSlide: {},
  viewMode: {},
  savedCourses: [],
  contentDepth: 'Low',
  loading: false,
  error: null,
  progress: 0,
  progressMessage: ''
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, currentStage: action.payload };
    
    case 'SET_PROMPT':
      return { ...state, userPrompt: action.payload };
    
    case 'SET_OUTLINE':
      return { ...state, courseOutline: action.payload };
    
    case 'SET_COURSE':
      return { ...state, fullCourse: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_PROGRESS':
      return { 
        ...state, 
        progress: action.payload.progress,
        progressMessage: action.payload.message
      };
    
    case 'UPDATE_QUIZ_SCORE':
      return {
        ...state,
        quizScores: {
          ...state.quizScores,
          [action.payload.moduleIndex]: action.payload.score
        }
      };
    
    case 'SET_CURRENT_SLIDE':
      return {
        ...state,
        currentSlide: {
          ...state.currentSlide,
          [action.payload.moduleIndex]: action.payload.slideIndex
        }
      };
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: {
          ...state.viewMode,
          [action.payload.moduleIndex]: action.payload.mode
        }
      };
    
    case 'LOAD_SAVED_COURSES':
      return { ...state, savedCourses: action.payload };
    
    case 'RESET_STATE':
      return {
        ...initialState,
        savedCourses: state.savedCourses
      };
    
    default:
      return state;
  }
}
```

### Step 10: Create Context Provider

Create `src/components/providers/CourseProvider.tsx`:
```typescript
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
```

### Step 11: Create Custom Hooks

Create `src/hooks/useCourseOperations.ts`:
```typescript
import { useCallback } from 'react';
import { useCourse } from '@/components/providers/CourseProvider';
import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';
import { CourseModule, SavedCourse } from '@/lib/types';

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
      
      const modules = await apiClient.generateOutline(prompt, numModules);
      dispatch({ type: 'SET_OUTLINE', payload: modules });
      dispatch({ type: 'SET_STAGE', payload: 'outlineReview' });
    } catch (error) {
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
    } catch (error) {
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
```

---

## Phase 4: UI Components

### Step 12: Create Base UI Components

Create `src/components/ui/Button.tsx`:
```typescript
import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-indigo-600 text-white hover:bg-indigo-700 hover:transform hover:-translate-y-1 hover:shadow-lg': variant === 'primary',
          'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 hover:transform hover:-translate-y-1': variant === 'secondary',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

Create `src/components/ui/Card.tsx`:
```typescript
import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx(
      'bg-white/80 backdrop-blur-lg border border-black/5 rounded-2xl shadow-xl p-10 transition-all duration-300',
      className
    )}>
      {children}
    </div>
  );
}
```

Create `src/components/ui/LoadingSpinner.tsx`:
```typescript
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto`} />
  );
}
```

### Step 13: Create Layout Components

Create `src/components/layout/Header.tsx`:
```typescript
'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="text-center mb-10 relative">
      <button 
        onClick={onMenuClick}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/50 transition-colors"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
        Agentic Course Designer
      </h1>
      <p className="text-gray-500 mt-2 text-lg">
        Your personal AI-powered learning architect.
      </p>
    </header>
  );
}
```

### Step 14: Create Course Components

Create `src/components/course/PromptForm.tsx`:
```typescript
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCourseOperations } from '@/hooks/useCourseOperations';

export function PromptForm() {
  const [prompt, setPrompt] = useState('');
  const [numModules, setNumModules] = useState('3');
  const [contentDepth, setContentDepth] = useState('Low');
  const { generateOutline } = useCourseOperations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert('Please enter a course prompt.');
      return;
    }
    generateOutline(prompt, parseInt(numModules), contentDepth);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Design Your Custom Course</h2>
        <p className="text-gray-500 mb-8">What do you want to learn today?</p>
      </div>
      
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
          Course Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
          rows={3}
          placeholder="e.g., A course on Brazilian Portuguese for someone who speaks Italian."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="modules" className="block text-sm font-medium text-gray-700">
            Course Length
          </label>
          <select
            id="modules"
            value={numModules}
            onChange={(e) => setNumModules(e.target.value)}
            className="mt-1 w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="1">1 Module (Quick Start)</option>
            <option value="2">2 Modules (Standard)</option>
            <option value="3">3 Modules (Deep Dive)</option>
          </select>
        </div>

        <div>
          <label htmlFor="depth" className="block text-sm font-medium text-gray-700">
            Content Depth
          </label>
          <select
            id="depth"
            value={contentDepth}
            onChange={(e) => setContentDepth(e.target.value)}
            className="mt-1 w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="Low">Low (Concise)</option>
            <option value="Medium">Medium (Detailed)</option>
            <option value="High">High (Comprehensive)</option>
          </select>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button type="submit" size="lg">
          Generate Outline
        </Button>
      </div>
    </form>
  );
}
```

---

## Phase 5: Complete Component Implementation

### Step 15-20: Implement Remaining Components

Continue implementing:
- `OutlineReview.tsx` - Review generated outline
- `CourseViewer.tsx` - Main course display
- `ModuleCard.tsx` - Collapsible module container  
- `SlideViewer.tsx` - Slide content and navigation
- `QuizComponent.tsx` - Interactive quiz interface
- `Sidebar.tsx` - Course history sidebar

### Step 21-25: Integration & Testing

- Wire up all components with context
- Implement error boundaries
- Add loading states and progress indicators
- Test course generation workflow
- Test quiz functionality and scoring

## Final Phase: Polish & Deploy

### Step 26-30: Final Steps

26. **Performance Optimization**
    - Implement React.memo for expensive components
    - Add image lazy loading
    - Optimize bundle size

27. **Accessibility**
    - Add ARIA labels and roles
    - Keyboard navigation support
    - Screen reader compatibility

28. **Error Handling**
    - Implement error boundaries
    - User-friendly error messages
    - Retry mechanisms

29. **Testing**
    - Unit tests for utilities and hooks
    - Integration tests for API routes
    - End-to-end tests for critical flows

30. **Deployment**
    - Configure environment variables
    - Build and deploy to Vercel/Netlify
    - Set up monitoring and analytics

## Migration Verification Checklist

- [ ] Course creation workflow works end-to-end
- [ ] AI APIs are properly integrated and secured
- [ ] Local storage functionality preserved
- [ ] All UI interactions work correctly
- [ ] Responsive design maintained
- [ ] Error states handled gracefully
- [ ] Performance is acceptable
- [ ] Code is properly typed with TypeScript
- [ ] Components are properly tested

## Post-Migration Enhancements

Once migration is complete, consider these improvements:
- User authentication system
- Database integration for course persistence
- Course sharing capabilities
- Advanced quiz types
- Progress tracking and analytics
- Course export functionality
- Mobile app using React Native

This guide provides a systematic approach to migrating your application while maintaining functionality and improving the overall architecture. 