import { test, expect } from '@playwright/test';

test.describe('S3 Storage Simple Test', () => {
  test.setTimeout(180000); // 3 minutes timeout for image generation

  test('should save and load course with S3 URLs', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Clear any existing courses first
    // Click the menu button (first button in the header)
    await page.locator('header button').first().click();
    const clearButton = page.locator('button:has-text("Clear History")');
    const isDisabled = await clearButton.isDisabled();
    
    if (!isDisabled) {
      await clearButton.click();
      await page.waitForSelector('text=No saved courses yet');
    }
    
    // Close sidebar by clicking the overlay
    await page.locator('.fixed.top-0.left-0.w-full.h-full.bg-black\\/50').click({ force: true });
    await page.waitForTimeout(500);
    
    // Create a new course
    console.log('Creating a new course...');
    await page.fill('textarea#prompt', 'Basic Python Programming');
    
    // Select low depth and 2 modules for faster generation
    await page.selectOption('select#depth', 'Low');
    await page.selectOption('select#modules', '2');
    
    // Generate outline
    await page.click('button:has-text("Generate Outline")');
    
    // Wait for outline review
    await page.waitForSelector('text=Review Your Course Outline', { timeout: 30000 });
    console.log('Outline generated');
    
    // Generate full course
    await page.click('button:has-text("Generate Full Course")');
    
    // Wait for course to be generated
    await page.waitForSelector('text=Module 1', { timeout: 120000 });
    console.log('Course generated successfully');
    
    // Capture the cover image URL
    const coverImage = page.locator('img').first();
    await coverImage.waitFor({ state: 'visible' });
    const originalImageUrl = await coverImage.getAttribute('src');
    console.log('Original image URL:', originalImageUrl);
    
    // Verify it's a valid URL (either S3 or OpenAI)
    expect(originalImageUrl).toBeTruthy();
    expect(originalImageUrl).toMatch(/^https?:\/\//);
    
    // Navigate away to test loading
    await page.locator('header button').first().click();
    await page.click('button:has-text("New")');
    await page.waitForSelector('textarea#prompt');
    
    // Load the saved course
    await page.locator('header button').first().click();
    
    // Listen for console messages
    let foundEffcientLoad = false;
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('All images found in storage, loading directly from S3')) {
        foundEffcientLoad = true;
        console.log('✅ Efficient loading detected:', text);
      }
      if (text.includes('Some images are missing, regenerating')) {
        console.log('⚠️ Regeneration detected:', text);
      }
    });
    
    // Click on the saved course
    await page.click('text=Basic Python Programming');
    
    // Wait for course to load
    await page.waitForSelector('text=Module 1', { timeout: 10000 });
    
    // Verify the image URL is the same
    const reloadedImage = page.locator('img').first();
    await reloadedImage.waitFor({ state: 'visible' });
    const reloadedImageUrl = await reloadedImage.getAttribute('src');
    
    // Images should be the same (loaded from storage)
    expect(reloadedImageUrl).toBe(originalImageUrl);
    
    // Verify efficient loading occurred
    await page.waitForTimeout(1000); // Give console messages time to appear
    expect(foundEffcientLoad).toBeTruthy();
    
    console.log('✅ Test passed: Course loaded efficiently with preserved S3 URLs');
  });
}); 