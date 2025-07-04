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

export async function generateImage(
  prompt: string, 
  courseId?: string, 
  moduleIndex?: number, 
  slideIndex?: number | 'cover'
) {
  return fetchApi<string>('/generate-image', {
    method: 'POST',
    body: JSON.stringify({ 
      prompt, 
      courseId, 
      moduleIndex, 
      slideIndex 
    }),
  });
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async generateOutline(prompt: string, numModules: number, depth: string = 'Medium'): Promise<CourseModule[]> {
    console.log('🔷 ApiClient.generateOutline called with:', { prompt, numModules, depth });
    
    const response = await fetch(`${this.baseUrl}/api/generate-outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, numModules, depth }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('🔷 API error response:', errorData);
      throw new Error(`Failed to generate outline: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔷 API response data:', data);
    
    // The API returns an array directly, not wrapped in a modules property
    return data;
  }

  async generateCourse(prompt: string, outline: CourseModule[], depth: string = 'Medium'): Promise<Course> {
    console.log('🔷 ApiClient.generateCourse called with:', { 
      prompt, 
      outlineLength: outline.length, 
      depth 
    });
    
    const response = await fetch(`${this.baseUrl}/api/generate-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, outline, depth }),
    });

    console.log('🔷 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔷 API error response:', errorText);
      throw new Error(`Failed to generate course: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔷 Course data received:', {
      hasData: !!data,
      hasModules: !!data?.modules,
      moduleCount: data?.modules?.length || 0,
      hasCoverImageUrl: !!data?.cover?.imageUrl,
      coverImageUrl: data?.cover?.imageUrl,
      firstSlideImageUrl: data?.modules?.[0]?.slides?.[0]?.imageUrl
    });
    
    // Log detailed module data
    if (data?.modules) {
      data.modules.forEach((module: any, mIdx: number) => {
        console.log(`🔷 Module ${mIdx}:`, {
          title: module.title,
          slideCount: module.slides?.length || 0,
          slides: module.slides?.map((slide: any, sIdx: number) => ({
            slideIndex: sIdx,
            title: slide.title,
            hasImageUrl: !!slide.imageUrl,
            imageUrl: slide.imageUrl
          }))
        });
      });
    }
    
    return data;
  }

  async generateImage(
    prompt: string, 
    courseId?: string, 
    moduleIndex?: number, 
    slideIndex?: number | 'cover'
  ): Promise<string> {
    console.log('🔷 ApiClient.generateImage called with:', { 
      prompt, 
      courseId, 
      moduleIndex, 
      slideIndex 
    });
    
    const response = await fetch(`${this.baseUrl}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        courseId, 
        moduleIndex, 
        slideIndex 
      }),
    });

    console.log('🔷 Image generation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔷 Image generation error:', errorText);
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔷 Image generation response data:', data);
    
    return data.imageUrl || data;
  }
}

export const apiClient = new ApiClient(); 