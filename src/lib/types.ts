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
  | { type: 'SET_CONTENT_DEPTH'; payload: ContentDepth }
  | { type: 'RESET_STATE' }; 