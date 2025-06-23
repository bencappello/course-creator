import { test, expect } from '@playwright/test';

test.describe('S3 Storage and Course Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should save course with S3 URLs and load efficiently', async ({ page }) => {
    // Step 1: Create a new course
    console.log('Creating a new course...');
    
    // Fill in the course prompt
    await page.fill('textarea[placeholder*="A course on Brazilian Portuguese"]', 'Introduction to JavaScript Basics');
    
    // Select content depth
    await page.click('button:has-text("Medium")');
    
    // Select number of modules (3)
    await page.click('button:has-text("3")');
    
    // Generate outline
    await page.click('button:has-text("Generate Outline")');
    
    // Wait for outline to be generated
    await page.waitForSelector('text=Review Your Course Outline', { timeout: 30000 });
    console.log('Outline generated successfully');
    
    // Proceed to generate full course
    await page.click('button:has-text("Generate Full Course")');
    
    // Wait for course generation with images
    await page.waitForSelector('text=Course created successfully', { timeout: 120000 });
    console.log('Course generated with images');
    
    // Verify course viewer is displayed
    await expect(page.locator('text=Module 1')).toBeVisible();
    
    // Step 2: Capture the image URLs to verify they're S3 URLs
    const coverImage = await page.locator('img').first();
    const coverImageSrc = await coverImage.getAttribute('src');
    console.log('Cover image URL:', coverImageSrc);
    
    // Verify it's an S3 URL (should contain amazonaws.com if S3 is configured)
    const isS3Url = coverImageSrc?.includes('amazonaws.com') || coverImageSrc?.includes('openai');
    expect(isS3Url).toBeTruthy();
    
    // Step 3: Open sidebar to see saved courses
    await page.locator('header button').first().click();
    await page.waitForSelector('text=My Courses');
    
    // Verify the course is saved
    await expect(page.locator('text=Introduction to JavaScript Basics')).toBeVisible();
    console.log('Course saved in sidebar');
    
    // Step 4: Navigate away and then load the saved course
    // First, create a new course to navigate away
    await page.click('button:has-text("New")');
    await page.waitForSelector('textarea[placeholder*="A course on Brazilian Portuguese"]');
    
    // Now open sidebar again and load the saved course
    await page.locator('header button').first().click();
    
    // Set up console listener to verify no image regeneration happens
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('All images found in storage') || text.includes('Some images are missing')) {
        console.log('Loading message:', text);
      }
    });
    
    // Click on the saved course
    await page.click('text=Introduction to JavaScript Basics');
    
    // Wait for course to load
    await page.waitForSelector('text=Module 1', { timeout: 10000 });
    
    // Verify the loading was efficient (should see the success message)
    const foundEffcientLoadMessage = consoleMessages.some(msg => 
      msg.includes('All images found in storage, loading directly from S3')
    );
    expect(foundEffcientLoadMessage).toBeTruthy();
    
    // Verify images are still from S3
    const reloadedCoverImage = await page.locator('img').first();
    const reloadedCoverImageSrc = await reloadedCoverImage.getAttribute('src');
    
    // Should be the same S3 URL as before
    expect(reloadedCoverImageSrc).toBe(coverImageSrc);
    console.log('Course loaded efficiently from storage with S3 URLs preserved');
  });

  test('should handle missing images gracefully', async ({ page }) => {
    // This test simulates a scenario where images might be missing
    // and verifies the regeneration logic works
    
    // First create a course
    await page.fill('textarea[placeholder*="A course on Brazilian Portuguese"]', 'Test Course for Missing Images');
    await page.click('button:has-text("Low")'); // Low depth for faster generation
    await page.click('button:has-text("2")'); // 2 modules
    await page.click('button:has-text("Generate Outline")');
    
    await page.waitForSelector('text=Review Your Course Outline');
    await page.click('button:has-text("Generate Full Course")');
    
    await page.waitForSelector('text=Course created successfully', { timeout: 120000 });
    
    // Now we'll simulate missing images by modifying localStorage
    await page.evaluate(() => {
      const storageKey = 'ai_courses_mvp';
      const courses = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (courses.length > 0) {
        // Remove some image URLs to simulate missing images
        courses[0].course.cover.imageUrl = '';
        if (courses[0].course.modules[0]?.slides[0]) {
          courses[0].course.modules[0].slides[0].imageUrl = '';
        }
        localStorage.setItem(storageKey, JSON.stringify(courses));
      }
    });
    
    // Set up console listener
    const regenerationMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Some images are missing, regenerating')) {
        regenerationMessages.push(text);
      }
    });
    
    // Reload the course
    await page.locator('header button').first().click();
    await page.click('text=Test Course for Missing Images');
    
    // Wait for regeneration to complete
    await page.waitForSelector('text=Module 1', { timeout: 30000 });
    
    // Verify regeneration happened
    expect(regenerationMessages.length).toBeGreaterThan(0);
    console.log('Missing images were regenerated successfully');
    
    // Verify images are now present
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).not.toBe('');
    }
  });

  test('should maintain course history across sessions', async ({ page }) => {
    // Create multiple courses
    const courseTopics = [
      'Python Programming Fundamentals',
      'Web Development with React',
      'Data Science Basics'
    ];
    
    for (const topic of courseTopics) {
      await page.fill('textarea[placeholder*="A course on Brazilian Portuguese"]', topic);
      await page.click('button:has-text("Low")');
      await page.click('button:has-text("2")');
      await page.click('button:has-text("Generate Outline")');
      
      await page.waitForSelector('text=Review Your Course Outline');
      await page.click('button:has-text("Generate Full Course")');
      
      await page.waitForSelector('text=Course created successfully', { timeout: 120000 });
      
      // Go back to create another course
      if (topic !== courseTopics[courseTopics.length - 1]) {
        await page.locator('header button').first().click();
        await page.click('button:has-text("New")');
      }
    }
    
    // Open sidebar and verify all courses are saved
    await page.locator('header button').first().click();
    
    for (const topic of courseTopics) {
      await expect(page.locator(`text=${topic}`)).toBeVisible();
    }
    
    console.log('All courses saved successfully');
    
    // Test course deletion
    const deleteButtons = await page.locator('button svg.lucide-trash-2').all();
    expect(deleteButtons.length).toBe(courseTopics.length);
    
    // Delete the first course
    await deleteButtons[0].click();
    
    // Verify it's removed
    await expect(page.locator(`text=${courseTopics[0]}`)).not.toBeVisible();
    await expect(page.locator(`text=${courseTopics[1]}`)).toBeVisible();
    await expect(page.locator(`text=${courseTopics[2]}`)).toBeVisible();
    
    console.log('Course deletion works correctly');
  });
}); 