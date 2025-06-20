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
    
    case 'SET_CONTENT_DEPTH':
      return { ...state, contentDepth: action.payload };
    
    case 'RESET_STATE':
      return {
        ...initialState,
        savedCourses: state.savedCourses
      };
    
    default:
      return state;
  }
} 