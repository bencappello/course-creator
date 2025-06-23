import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CourseModule } from '@/lib/types';
import { batchUploadImagesToS3, generateS3Key } from '@/lib/s3';
import { envConfig } from '@/lib/env-config';

const openai = new OpenAI({
  apiKey: envConfig.openai.apiKey,
});

interface OutlineModule {
  title: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, outline, depth } = await request.json();
    
    console.log('🔸 Generate course request received:', {
      hasPrompt: !!prompt,
      hasOutline: !!outline,
      hasDepth: !!depth,
      outlineLength: outline?.length
    });

    if (!envConfig.openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Check if S3 is configured
    const s3Configured = !!(
      envConfig.aws.accessKeyId && 
      envConfig.aws.secretAccessKey && 
      envConfig.s3.bucketName
    );

    if (!outline || !Array.isArray(outline)) {
      console.error('🔸 Invalid outline provided');
      return NextResponse.json(
        { error: 'Invalid outline provided' },
        { status: 400 }
      );
    }

    // Determine content length based on depth
    const contentConfig = {
      Low: { summaryLength: 100, detailsCount: 2, deepDiveCount: 1 },
      Medium: { summaryLength: 150, detailsCount: 3, deepDiveCount: 2 },
      High: { summaryLength: 200, detailsCount: 4, deepDiveCount: 3 }
    };

    const config = contentConfig[depth as keyof typeof contentConfig] || contentConfig.Medium;

    // Generate course cover
    const coverPrompt = `Generate a course title and image description for a course with these modules: ${outline.map((m: OutlineModule) => m.title).join(', ')}. 
    Return as JSON with format: { "title": "Course Title", "imagePrompt": "detailed image description for course cover" }`;

    const coverResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a course designer. Create engaging course titles and visual descriptions.' },
        { role: 'user', content: coverPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const coverContent = JSON.parse(coverResponse.choices[0].message.content || '{}');

    // Generate full course modules
    const modules: CourseModule[] = await Promise.all(
      outline.map(async (module: OutlineModule) => {
        const modulePrompt = `Create a detailed course module for: "${module.title}" - ${module.description}
        
        Generate exactly 3 slides and 3 quiz questions.
        
        For each slide, provide:
        - title: Clear, descriptive slide title
        - image_prompt: Detailed description for an educational image
        - content: An object with:
          - summary: ${config.summaryLength} word overview
          - details: Array of ${config.detailsCount} detailed points
          - deep_dive: Array of ${config.deepDiveCount} in-depth explanations
        
        For quiz questions, provide:
        - question: Clear question text
        - options: Array of 4 possible answers
        - correct_answer: The correct option (must match one of the options exactly)
        
        Return as JSON with format:
        {
          "slides": [...],
          "quiz": [...]
        }`;

        const moduleResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert educator creating comprehensive course content.' },
            { role: 'user', content: modulePrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        });

        const moduleContent = JSON.parse(moduleResponse.choices[0].message.content || '{}');

        return {
          title: module.title,
          description: module.description,
          slides: moduleContent.slides || [],
          quiz: moduleContent.quiz || []
        };
      })
    );

    // Create course ID
    const courseId = Date.now().toString();
    
    // Collect all image prompts with their positions
    const allImagePrompts: Array<{ prompt: string; key: string; type: 'cover' | 'slide' }> = [];
    
    // Add cover image if prompt exists
    if (coverContent.imagePrompt) {
      allImagePrompts.push({
        prompt: coverContent.imagePrompt,
        key: generateS3Key(courseId, 0, 'cover'),
        type: 'cover'
      });
    }
    
    // Add all slide images
    modules.forEach((module, moduleIndex) => {
      module.slides.forEach((slide, slideIndex) => {
        if (slide.image_prompt) {
          allImagePrompts.push({
            prompt: slide.image_prompt,
            key: generateS3Key(courseId, moduleIndex, slideIndex),
            type: 'slide'
          });
        }
      });
    });

    // Skip image generation if configured
    if (envConfig.app.skipImageGeneration) {
      console.log('🎨 Skipping image generation (SKIP_IMAGE_GENERATION=true)');
      console.log(`📚 Creating course with ${modules.length} modules and 0 images`);
      return NextResponse.json({
        id: courseId,
        prompt,
        depth,
        cover: {
          imageUrl: '',
          image_prompt: coverContent.imagePrompt || ''
        },
        modules,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Variable to track final cover image URL
    let finalCoverImageUrl = '';

    // Generate all images in batch
    console.log('🔍 DEBUG: allImagePrompts.length =', allImagePrompts.length);
    console.log('🔍 DEBUG: SKIP_IMAGE_GENERATION =', envConfig.app.skipImageGeneration);
    
    if (allImagePrompts.length > 0) {
      console.log(`🖼️ Generating ${allImagePrompts.length} images...`);
      console.log('📋 Image prompts collected:', allImagePrompts.map(p => ({
        type: p.type,
        promptLength: p.prompt.length,
        key: p.key
      })));
      
      try {
        // Test internal API call first
        console.log('🧪 Testing internal API call...');
        const testResponse = await fetch('http://localhost:3000/api/test-internal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        console.log('🧪 Test response status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('🧪 Test response data:', testData);
        }
        
        console.log('🔗 Calling generate-image endpoint for batch generation...');
        // Use localhost for server-to-server communication
        const imageApiUrl = 'http://localhost:3000/api/generate-image';
        console.log('🔗 Image API URL:', imageApiUrl);
        console.log('🔍 DEBUG: Using hardcoded localhost URL for server-to-server communication');
        console.log('🔍 DEBUG: Sending prompts:', allImagePrompts.map(p => p.prompt.substring(0, 50) + '...'));
        
        let response;
        try {
          response = await fetch(imageApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompts: allImagePrompts.map(p => p.prompt),
              batchSize: 5, // Process 5 images at a time
            })
          });
          console.log('📨 Image generation response status:', response.status);
        } catch (fetchError) {
          console.error('❌ Fetch error:', fetchError);
          console.error('❌ Failed to call image API at:', imageApiUrl);
          throw fetchError;
        }
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('📨 Image generation response:', {
            hasImageUrls: !!responseData.imageUrls,
            imageCount: responseData.imageUrls?.length || 0,
            totalGenerated: responseData.totalGenerated,
            totalRequested: responseData.totalRequested
          });
          
          const { imageUrls } = responseData;
          
          // Check if we actually got image URLs
          if (!imageUrls || imageUrls.length === 0) {
            console.error('❌ No image URLs returned from image generation API');
            console.log('⚠️ Continuing without images');
          } else {
            console.log(`✅ Received ${imageUrls.length} image URLs from API`);
          }
          
          // Upload to S3 if configured
          if (s3Configured && imageUrls && imageUrls.length > 0) {
            console.log('📤 Uploading images to S3...');
            console.log('🪣 S3 bucket:', envConfig.s3.bucketName);
            
            const imagesToUpload = imageUrls.map((url: string, index: number) => ({
              url,
              key: allImagePrompts[index].key
            }));
            
            const s3Results = await batchUploadImagesToS3(imagesToUpload);
            console.log('📤 S3 upload results:', s3Results.length, 'images uploaded');
            
            // Create a map to track image assignments
            const imageMap = new Map<string, string>();
            s3Results.forEach((result, idx) => {
              imageMap.set(allImagePrompts[idx].key, result.s3Url);
            });
            
            // Store cover image URL separately
            if (coverContent.imagePrompt && imageMap.has(generateS3Key(courseId, 0, 'cover'))) {
              finalCoverImageUrl = imageMap.get(generateS3Key(courseId, 0, 'cover')) || '';
            }
            
            // Map slide images
            modules.forEach((module, moduleIndex) => {
              module.slides.forEach((slide, slideIndex) => {
                if (slide.image_prompt) {
                  const key = generateS3Key(courseId, moduleIndex, slideIndex);
                  if (imageMap.has(key)) {
                    slide.imageUrl = imageMap.get(key) || '';
                    console.log(`🔍 Assigned S3 URL to module ${moduleIndex}, slide ${slideIndex}:`, slide.imageUrl);
                  } else {
                    console.warn(`⚠️ No S3 URL found for key: ${key}`);
                  }
                }
              });
            });
            
            console.log('✅ All images uploaded to S3 successfully');
          } else {
            // Use OpenAI URLs directly if S3 not configured
            console.log('💾 Using OpenAI URLs directly (S3 not configured or no images)');
            let imageIndex = 0;
            
            // Process cover image
            if (coverContent.imagePrompt && imageUrls[imageIndex]) {
              finalCoverImageUrl = imageUrls[imageIndex++];
            }
            
            // Process slide images
            modules.forEach((module, moduleIndex) => {
              module.slides.forEach((slide, slideIndex) => {
                if (slide.image_prompt && imageUrls[imageIndex]) {
                  slide.imageUrl = imageUrls[imageIndex++];
                  console.log(`🔍 Assigned OpenAI URL to module ${moduleIndex}, slide ${slideIndex}:`, slide.imageUrl);
                }
              });
            });
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Image generation failed:', response.status, errorText);
        }
      } catch (error) {
        console.error('❌ Failed to generate/upload images:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          errorType: error?.constructor?.name
        });
        // Log the state of variables
        console.log('🔍 Debug state:', {
          allImagePromptsLength: allImagePrompts.length,
          finalCoverImageUrl,
          firstModuleFirstSlideUrl: modules[0]?.slides?.[0]?.imageUrl
        });
        // Continue without images rather than failing the entire course generation
        console.log('⚠️ WARNING: Image generation failed, continuing without images');
      }
    } else {
      console.log('⚠️ No image prompts to generate');
    }

    console.log(`📚 Course created with ${modules.length} modules and ${allImagePrompts.length} images`);
    console.log('🔍 Final cover image URL:', finalCoverImageUrl);
    console.log('🔍 Module image URLs:', modules.map((m, idx) => ({
      module: idx,
      slides: m.slides.map((s, sIdx) => ({
        slide: sIdx,
        hasImageUrl: !!s.imageUrl,
        imageUrl: s.imageUrl
      }))
    })));
    
    // Final check before response
    const responseData = {
      id: courseId,
      prompt,
      depth,
      cover: {
        imageUrl: finalCoverImageUrl,
        image_prompt: coverContent.imagePrompt || ''
      },
      modules,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📦 Final response data check:', {
      courseId: responseData.id,
      hasCoverUrl: !!responseData.cover.imageUrl,
      coverUrl: responseData.cover.imageUrl,
      firstSlideUrl: responseData.modules[0]?.slides?.[0]?.imageUrl,
      totalSlides: responseData.modules.reduce((acc, m) => acc + m.slides.length, 0)
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json(
      { error: 'Failed to generate course content' },
      { status: 500 }
    );
  }
} 