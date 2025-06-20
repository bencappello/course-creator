# AI Course Designer - Next.js Architecture Plan

## Executive Summary

This document outlines the architecture plan for porting the AI Course Designer from a single HTML file with vanilla JavaScript to a modern Next.js application. The migration will improve maintainability, scalability, security, and user experience while preserving all existing functionality.

## Current Application Analysis

### Core Features
- **Course Creation Workflow**: Multi-step process from prompt input to full course generation
- **AI Integration**: Uses Google's Gemini 2.0 Flash for content generation and Imagen API for image creation
- **Interactive Course Viewer**: Slide navigation, quiz functionality, and progress tracking
- **Data Persistence**: Local storage for saving and loading courses
- **Responsive UI**: Modern design with Tailwind CSS and custom animations

### Current Architecture Limitations
- **Monolithic Structure**: Single file with embedded HTML, CSS, and JavaScript
- **Global State Management**: Simple object-based state without proper reactivity
- **Direct DOM Manipulation**: Imperative UI updates prone to bugs
- **Client-side API Keys**: Security vulnerability with exposed API credentials
- **No Code Organization**: All logic mixed together without separation of concerns

## Next.js Architecture Overview

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context + useReducer
- **Data Fetching**: Next.js API Routes + Custom Hooks
- **Storage**: Browser localStorage with React integration

### Project Structure

```
course-designer/
├── app/                          # App Router structure
│   ├── globals.css              # Global styles and Tailwind imports
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page (course creation)
│   ├── course/
│   │   └── [id]/
│   │       └── page.tsx         # Individual course view
│   └── api/                     # Server-side API routes
│       ├── generate-outline/
│       │   └── route.ts         # Course outline generation
│       ├── generate-course/
│       │   └── route.ts         # Full course content generation
│       └── generate-image/
│           └── route.ts         # Image generation proxy
├── components/                   # React components
│   ├── ui/                      # Reusable UI primitives
│   │   ├── Button.tsx           # Styled button variants
│   │   ├── Card.tsx             # Card container component
│   │   ├── LoadingSpinner.tsx   # Loading animation
│   │   ├── ProgressBar.tsx      # Progress indication
│   │   └── Input.tsx            # Form input components
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx           # Application header
│   │   ├── Sidebar.tsx          # Course history sidebar
│   │   └── Layout.tsx           # Main layout wrapper
│   ├── course/                  # Course-specific components
│   │   ├── PromptForm.tsx       # Course creation form
│   │   ├── OutlineReview.tsx    # Generated outline review
│   │   ├── CourseViewer.tsx     # Main course display
│   │   ├── ModuleCard.tsx       # Individual module container
│   │   ├── SlideViewer.tsx      # Slide content and navigation
│   │   └── QuizComponent.tsx    # Interactive quiz interface
│   └── providers/
│       └── CourseProvider.tsx   # Global state provider
├── lib/                         # Utility libraries
│   ├── types.ts                 # TypeScript type definitions
│   ├── api-client.ts           # API client utilities
│   ├── storage.ts              # Local storage helpers
│   ├── utils.ts                # General utility functions
│   └── constants.ts            # Application constants
├── hooks/                       # Custom React hooks
│   ├── useCourses.ts           # Course management operations
│   ├── useLocalStorage.ts      # Local storage integration
│   ├── useAsync.ts             # Async operation handling
│   └── useProgress.ts          # Progress tracking
└── styles/
    └── components.css          # Additional component styles
```

## Core Architecture Decisions

### 1. State Management Strategy

**Approach**: React Context + useReducer pattern
```typescript
interface AppState {
  currentStage: 'prompt' | 'outlineReview' | 'generatingCourse' | 'courseView';
  userPrompt: string;
  courseOutline: CourseModule[] | null;
  fullCourse: Course | null;
  quizScores: Record<number, QuizScore>;
  currentSlide: Record<number, number>;
  viewMode: Record<number, 'slide' | 'quiz'>;
  savedCourses: SavedCourse[];
  contentDepth: 'Low' | 'Medium' | 'High';
  loading: boolean;
  error: string | null;
}
```

**Benefits**:
- Predictable state updates through reducer actions
- Type-safe state management with TypeScript
- Context prevents prop drilling
- Easy testing and debugging

### 2. API Architecture

**Server-side API Routes**: All external API calls proxied through Next.js API routes

```typescript
// app/api/generate-outline/route.ts
export async function POST(request: Request) {
  const { prompt, numModules } = await request.json();
  
  // Server-side API key usage
  const response = await callGeminiAPI(prompt, {
    apiKey: process.env.GEMINI_API_KEY
  });
  
  return Response.json(response);
}
```

**Benefits**:
- API keys secured on server-side
- Rate limiting and error handling
- Request/response transformation
- Caching capabilities

### 3. Component Architecture

**Compound Component Pattern** for complex UI elements:
```typescript
<CourseViewer>
  <CourseViewer.Header />
  <CourseViewer.Cover />
  <CourseViewer.Modules>
    <ModuleCard>
      <ModuleCard.Header />
      <ModuleCard.Content>
        <SlideViewer />
        <QuizComponent />
      </ModuleCard.Content>
    </ModuleCard>
  </CourseViewer.Modules>
</CourseViewer>
```

**Benefits**:
- Flexible component composition
- Clear component boundaries
- Reusable patterns
- Easy to test individually

### 4. Data Flow Architecture

```
User Interaction
       ↓
React Component
       ↓
Custom Hook / Context Action
       ↓
API Route (Next.js)
       ↓
External AI Service
       ↓
Response Processing
       ↓
State Update (Context)
       ↓
Component Re-render
       ↓
Local Storage Sync
```

## Type Safety with TypeScript

### Core Data Types
```typescript
interface Course {
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

interface CourseModule {
  title: string;
  slides: Slide[];
  quiz: QuizQuestion[];
}

interface Slide {
  title: string;
  image_prompt: string;
  imageUrl?: string;
  content: {
    summary: string;
    details: string[];
    deep_dive: string[];
  };
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}
```

## Performance Optimizations

### 1. Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting with Next.js App Router
- Lazy loading for course images

### 2. Image Optimization
- Next.js Image component for automatic optimization
- Progressive loading for generated images
- WebP format conversion

### 3. Caching Strategy
- API response caching for identical requests
- Local storage caching for course data
- Browser caching for static assets

### 4. Bundle Optimization
- Tree shaking for unused code elimination
- Component lazy loading
- CSS-in-JS optimization

## Security Considerations

### 1. API Key Management
- Environment variables for all API keys
- Server-side API proxy routes
- No client-side exposure of sensitive credentials

### 2. Input Validation
- Server-side validation for all API inputs
- Client-side form validation
- Sanitization of user-generated content

### 3. Error Handling
- Graceful error boundaries
- User-friendly error messages
- Proper error logging

## Scalability Considerations

### 1. Database Integration (Future)
- Easy migration path from localStorage to database
- User authentication system ready
- Multi-user course sharing capabilities

### 2. Component Library
- Reusable UI component system
- Design system documentation
- Easy theming and customization

### 3. Testing Strategy
- Unit tests for business logic
- Integration tests for API routes
- End-to-end tests for critical user flows

## Migration Benefits

### Developer Experience
- **Type Safety**: Catch errors at compile time
- **Hot Reloading**: Faster development iteration
- **Code Organization**: Clear separation of concerns
- **Testing**: Easier unit and integration testing

### User Experience
- **Performance**: Faster loading and interactions
- **Reliability**: Better error handling and recovery
- **Accessibility**: Built-in accessibility features
- **Mobile**: Improved responsive design

### Maintainability
- **Modular Architecture**: Easy to modify individual features
- **Code Reusability**: Shared components and utilities
- **Documentation**: Self-documenting code with TypeScript
- **Version Control**: Better diff tracking with organized files

This architecture provides a solid foundation for the current application while enabling future enhancements and scaling opportunities. 