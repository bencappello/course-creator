import { Page } from '@playwright/test';

export const testCourses = {
  basic: {
    prompt: 'Introduction to TypeScript',
    modules: '2 Modules (Standard)',
    depth: 'Medium (Detailed)'
  },
  quick: {
    prompt: 'Quick Python Tutorial',
    modules: '1 Module (Quick Start)', 
    depth: 'Low (Concise)'
  },
  comprehensive: {
    prompt: 'Advanced React Development',
    modules: '3 Modules (Deep Dive)',
    depth: 'High (Comprehensive)'
  }
};

export const timeouts = {
  outlineGeneration: 15000,
  courseGeneration: 45000,
  imageLoading: 30000,
  navigation: 5000
};

export const selectors = {
  coursePrompt: 'Course Prompt',
  courseLength: 'Course Length',
  contentDepth: 'Content Depth',
  generateOutline: 'Generate Outline',
  generateCourse: 'Generate Full Course',
  reviewOutline: 'Review Your Course Outline',
  home: 'Home',
  download: 'Download',
  takeQuiz: 'Take Quiz',
  submitAnswer: 'Submit Answer',
  startOver: 'Start Over',
  previous: 'Previous',
  next: 'Next'
};

export async function waitForImages(page: Page) {
  // Wait for all images to load
  await page.waitForLoadState('networkidle');
  
  // Additional check for image elements
  const images = await page.locator('img').all();
  for (const img of images) {
    await img.waitFor({ state: 'visible' });
    const src = await img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      // Wait for actual image to load
      await page.waitForResponse((response) => 
        response.url().includes(src) && response.status() === 200
      );
    }
  }
} 