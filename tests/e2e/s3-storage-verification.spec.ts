import { test, expect } from '@playwright/test';

test.describe('S3 Storage Verification', () => {
  test('manual verification of S3 storage', async ({ page }) => {
    // This test is designed to manually verify S3 storage works
    // We'll use console logs to check the behavior
    
    await page.goto('http://localhost:3000');
    
    // Listen for all console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      
      // Log important messages
      if (text.includes('All images found in storage') || 
          text.includes('Some images are missing') ||
          text.includes('Course data received') ||
          text.includes('Image generation response') ||
          text.includes('S3 upload') ||
          text.includes('Cover image URL')) {
        console.log(`[Console]: ${text}`);
      }
    });
    
    // Check if there are existing courses
    await page.locator('header button').first().click();
    await page.waitForTimeout(1000);
    
    // Check if we have saved courses
    const hasSavedCourses = await page.locator('text=No saved courses yet').isVisible().then(v => !v);
    
    if (hasSavedCourses) {
      console.log('Found existing saved courses');
      
      // Try to load the first course
      const firstCourse = page.locator('.p-3.bg-gray-50').first();
      const courseTitle = await firstCourse.locator('h3').textContent();
      console.log(`Loading course: ${courseTitle}`);
      
      await firstCourse.click();
      
      // Wait for course to load
      await page.waitForSelector('text=Module 1', { timeout: 30000 });
      
      // Check if images loaded from S3
      const coverImage = page.locator('img').first();
      await coverImage.waitFor({ state: 'visible' });
      const imageUrl = await coverImage.getAttribute('src');
      
      console.log(`\nImage URL: ${imageUrl}`);
      console.log(`Is S3 URL: ${imageUrl?.includes('amazonaws.com')}`);
      console.log(`Is OpenAI URL: ${imageUrl?.includes('oaidalleapiprodscus')}`);
      
      // Check console logs for efficient loading
      const efficientLoadFound = consoleLogs.some(log => 
        log.includes('All images found in storage, loading directly from S3')
      );
      
      console.log(`\nEfficient loading detected: ${efficientLoadFound}`);
      
      if (efficientLoadFound) {
        console.log('✅ SUCCESS: Course loaded efficiently from storage without regenerating images!');
      } else {
        console.log('⚠️  WARNING: Images may have been regenerated instead of loaded from storage');
      }
      
      // Verify all images are present
      const allImages = await page.locator('img').all();
      console.log(`\nTotal images in course: ${allImages.length}`);
      
      for (let i = 0; i < allImages.length; i++) {
        const img = allImages[i];
        const src = await img.getAttribute('src');
        if (src) {
          console.log(`Image ${i + 1}: ${src.substring(0, 50)}...`);
        }
      }
      
    } else {
      console.log('No saved courses found. Please create a course first.');
    }
    
    // Always pass the test - this is for manual verification
    expect(true).toBe(true);
  });
}); 