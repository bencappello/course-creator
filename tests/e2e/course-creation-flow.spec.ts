import { test, expect } from '@playwright/test';

test.describe('AI Course Designer - Course Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await expect(page).toHaveTitle('Agentic Course Designer');
    await expect(page.getByRole('heading', { name: 'Agentic Course Designer' })).toBeVisible();
  });

  test('Complete course creation flow with image generation', async ({ page }) => {
    // Step 1: Fill in the course prompt
    await test.step('Enter course prompt', async () => {
      const promptTextbox = page.getByRole('textbox', { name: 'Course Prompt' });
      await expect(promptTextbox).toBeVisible();
      await promptTextbox.fill('Introduction to Machine Learning');
    });

    // Step 2: Select course configuration
    await test.step('Configure course settings', async () => {
      // Select number of modules
      const modulesSelect = page.getByLabel('Course Length');
      await modulesSelect.selectOption('2 Modules (Standard)');
      
      // Select content depth
      const depthSelect = page.getByLabel('Content Depth');
      await depthSelect.selectOption('Medium (Detailed)');
    });

    // Step 3: Generate outline
    await test.step('Generate course outline', async () => {
      // Click generate outline button
      await page.getByRole('button', { name: 'Generate Outline' }).click();
      
      // Wait for outline to be generated
      await expect(page.getByRole('heading', { name: 'Review Your Course Outline' })).toBeVisible({
        timeout: 10000
      });
      
      // Verify outline contains expected number of modules
      const moduleHeadings = page.locator('h3').filter({ hasText: 'Module' });
      await expect(moduleHeadings).toHaveCount(2);
    });

    // Step 4: Generate full course
    await test.step('Generate full course content', async () => {
      // Click generate full course button
      await page.getByRole('button', { name: 'Generate Full Course' }).click();
      
      // Wait for loading state
      await expect(page.getByText('Generating your course...')).toBeVisible();
      
      // Wait for course to be generated (this can take a while)
      await expect(page.getByRole('heading', { name: 'Introduction to Machine Learning', level: 1 })).toBeVisible({
        timeout: 30000
      });
    });

    // Step 5: Verify course viewer loaded
    await test.step('Verify course viewer components', async () => {
      // Check navigation buttons
      await expect(page.getByRole('button', { name: 'Home' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
      
      // Check course navigation
      await expect(page.getByText('Module 1 of 2')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Take Quiz' })).toBeVisible();
      
      // Check slide navigation
      await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    });

    // Step 6: Wait for images to load
    await test.step('Verify images loaded', async () => {
      // Wait for course cover image
      const coverImage = page.getByRole('img', { name: 'Course Cover' });
      await expect(coverImage).toBeVisible({ timeout: 30000 });
      
      // Wait for slide image
      const slideImages = page.getByRole('img').filter({ 
        hasNot: page.getByRole('img', { name: 'Course Cover' }) 
      });
      await expect(slideImages.first()).toBeVisible({ timeout: 30000 });
      
      // Verify images have valid src
      const coverImageSrc = await coverImage.getAttribute('src');
      expect(coverImageSrc).toBeTruthy();
      expect(coverImageSrc).toContain('blob.core.windows.net');
    });

    // Step 7: Test slide navigation
    await test.step('Test slide navigation', async () => {
      // Click next button
      await page.getByRole('button', { name: 'Next' }).click();
      
      // Verify we're on slide 2
      await expect(page.getByText('Slide 2 of 3')).toBeVisible();
      
      // Verify previous button is now enabled
      await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    });

    // Step 8: Test module navigation
    await test.step('Test module navigation', async () => {
      // Click on second module
      const modules = page.locator('button').filter({ hasText: /Module \d+:/ });
      await modules.nth(1).click();
      
      // Verify we're on the second module
      await expect(page.getByText('Module 2 of 2')).toBeVisible();
    });

    // Step 9: Test quiz functionality
    await test.step('Test quiz functionality', async () => {
      // Click take quiz button
      await page.getByRole('button', { name: 'Take Quiz' }).click();
      
      // Verify quiz is displayed
      await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible();
      
      // Select an answer
      const answerOptions = page.locator('button').filter({ hasText: /^[A-D]\./ });
      await expect(answerOptions).toHaveCount(4);
      await answerOptions.first().click();
      
      // Submit answer
      await page.getByRole('button', { name: 'Submit Answer' }).click();
      
      // Verify feedback is shown
      await expect(page.locator('text=/Correct!|Incorrect/i')).toBeVisible();
    });

    // Step 10: Verify course is saved
    await test.step('Verify course is saved', async () => {
      // Go back home
      await page.getByRole('button', { name: 'Home' }).click();
      
      // Verify we're back on the home page
      await expect(page.getByRole('heading', { name: 'Design Your Custom Course' })).toBeVisible();
      
      // Check that the course appears in saved courses
      const savedCourses = page.locator('h3').filter({ hasText: 'Introduction to Machine Learning' });
      await expect(savedCourses).toHaveCount(1);
    });
  });

  test('Error handling - Empty prompt', async ({ page }) => {
    // Try to generate outline without entering a prompt
    await page.getByRole('button', { name: 'Generate Outline' }).click();
    
    // Verify error state (button should remain on same page)
    await expect(page.getByRole('heading', { name: 'Design Your Custom Course' })).toBeVisible();
  });

  test('Different content depths', async ({ page }) => {
    const depths = ['Low (Concise)', 'Medium (Detailed)', 'High (Comprehensive)'];
    
    for (const depth of depths) {
      await test.step(`Test ${depth} content depth`, async () => {
        // Enter prompt
        await page.getByRole('textbox', { name: 'Course Prompt' }).fill(`Test course for ${depth}`);
        
        // Select depth
        await page.getByLabel('Content Depth').selectOption(depth);
        
        // Generate outline
        await page.getByRole('button', { name: 'Generate Outline' }).click();
        
        // Wait for outline
        await expect(page.getByRole('heading', { name: 'Review Your Course Outline' })).toBeVisible({
          timeout: 10000
        });
        
        // Go back to start
        await page.getByRole('button', { name: 'Start Over' }).click();
      });
    }
  });

  test('Saved courses functionality', async ({ page }) => {
    // Create a quick course
    await page.getByRole('textbox', { name: 'Course Prompt' }).fill('Quick Test Course');
    await page.getByLabel('Course Length').selectOption('1 Module (Quick Start)');
    await page.getByRole('button', { name: 'Generate Outline' }).click();
    await expect(page.getByRole('heading', { name: 'Review Your Course Outline' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Generate Full Course' }).click();
    await expect(page.getByRole('heading', { name: 'Quick Test Course', level: 1 })).toBeVisible({ timeout: 30000 });
    
    // Go home
    await page.getByRole('button', { name: 'Home' }).click();
    
    // Verify course is in saved courses
    await expect(page.locator('h3').filter({ hasText: 'Quick Test Course' })).toBeVisible();
    
    // Load the saved course
    await page.locator('h3').filter({ hasText: 'Quick Test Course' }).click();
    
    // Verify course loaded
    await expect(page.getByRole('heading', { name: 'Quick Test Course', level: 1 })).toBeVisible();
  });
});

// Performance tests
test.describe('Performance Tests', () => {
  test('Course generation should complete within acceptable time', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // Quick course generation
    await page.getByRole('textbox', { name: 'Course Prompt' }).fill('Performance Test');
    await page.getByLabel('Course Length').selectOption('1 Module (Quick Start)');
    await page.getByLabel('Content Depth').selectOption('Low (Concise)');
    
    // Generate outline
    await page.getByRole('button', { name: 'Generate Outline' }).click();
    await expect(page.getByRole('heading', { name: 'Review Your Course Outline' })).toBeVisible({ timeout: 15000 });
    
    // Generate course
    await page.getByRole('button', { name: 'Generate Full Course' }).click();
    await expect(page.getByRole('heading', { name: 'Performance Test', level: 1 })).toBeVisible({ timeout: 45000 });
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`Total course generation time: ${totalTime}s`);
    expect(totalTime).toBeLessThan(60); // Should complete in under 60 seconds
  });
}); 