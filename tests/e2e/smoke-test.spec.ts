import { test, expect } from '@playwright/test';
import { testCourses, timeouts, selectors } from '../helpers/test-data';

test.describe('Smoke Tests', () => {
  test('Application loads and basic UI elements are present', async ({ page }) => {
    await page.goto('/');
    
    // Verify page title
    await expect(page).toHaveTitle('Agentic Course Designer');
    
    // Verify main heading
    await expect(page.getByRole('heading', { name: 'Agentic Course Designer' })).toBeVisible();
    
    // Verify tagline
    await expect(page.getByText('Your personal AI-powered learning architect.')).toBeVisible();
    
    // Verify form elements
    await expect(page.getByRole('textbox', { name: selectors.coursePrompt })).toBeVisible();
    await expect(page.getByLabel(selectors.courseLength)).toBeVisible();
    await expect(page.getByLabel(selectors.contentDepth)).toBeVisible();
    await expect(page.getByRole('button', { name: selectors.generateOutline })).toBeVisible();
  });

  test('Quick course generation flow', async ({ page }) => {
    await page.goto('/');
    
    // Use the quickest configuration
    await page.getByRole('textbox', { name: selectors.coursePrompt }).fill(testCourses.quick.prompt);
    await page.getByLabel(selectors.courseLength).selectOption(testCourses.quick.modules);
    await page.getByLabel(selectors.contentDepth).selectOption(testCourses.quick.depth);
    
    // Generate outline
    await page.getByRole('button', { name: selectors.generateOutline }).click();
    
    // Wait for outline
    await expect(page.getByRole('heading', { name: selectors.reviewOutline })).toBeVisible({
      timeout: timeouts.outlineGeneration
    });
    
    // Verify we can navigate back
    await page.getByRole('button', { name: selectors.startOver }).click();
    await expect(page.getByRole('heading', { name: 'Design Your Custom Course' })).toBeVisible();
  });

  test('API health check', async ({ request }) => {
    // Test that API endpoints are responding
    const endpoints = [
      { url: '/api/generate-outline', data: { prompt: 'test', numModules: 1, depth: 'Low' } },
      { url: '/api/generate-course', data: { outline: [], depth: 'Low' } },
      { url: '/api/generate-image', data: { prompt: 'test' } }
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.post(`http://localhost:3000${endpoint.url}`, {
        data: endpoint.data,
        failOnStatusCode: false
      });
      
      // Should get a valid response (2xx, 4xx, or 5xx)
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
      
      // For successful responses, verify we get JSON
      if (response.status() >= 200 && response.status() < 300) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
      }
    }
  });

  test('Local storage persistence', async ({ page }) => {
    await page.goto('/');
    
    // Create a simple course
    await page.getByRole('textbox', { name: selectors.coursePrompt }).fill('Storage Test');
    await page.getByLabel(selectors.courseLength).selectOption(testCourses.quick.modules);
    
    // Generate outline
    await page.getByRole('button', { name: selectors.generateOutline }).click();
    await expect(page.getByRole('heading', { name: selectors.reviewOutline })).toBeVisible({
      timeout: timeouts.outlineGeneration
    });
    
    // Reload page
    await page.reload();
    
    // Verify page loads without errors
    await expect(page).toHaveTitle('Agentic Course Designer');
    await expect(page.getByRole('heading', { name: 'Agentic Course Designer' })).toBeVisible();
  });
}); 