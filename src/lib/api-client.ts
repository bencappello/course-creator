import { CourseModule, Course } from './types';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function generateOutline(prompt: string, numModules: number, depth: string) {
  return fetchApi('/generate-outline', {
    method: 'POST',
    body: JSON.stringify({ prompt, numModules, depth }),
  });
}

export async function generateCourse(outline: CourseModule[], depth: string) {
  return fetchApi('/generate-course', {
    method: 'POST',
    body: JSON.stringify({ outline, depth }),
  });
}

export async function generateImage(prompt: string) {
  return fetchApi<string>('/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
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