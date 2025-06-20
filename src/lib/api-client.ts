import { CourseModule, Course } from './types';

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