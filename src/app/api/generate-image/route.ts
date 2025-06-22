import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { uploadImageToS3, generateS3Key } from '@/lib/s3';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use only DALL-E 2 since it's the only model that supports 256x256
const IMAGE_MODEL = 'dall-e-2';
const IMAGE_SIZE = '256x256';

async function generateImage(prompt: string) {
  try {
    console.log(`Generating 256x256 image with model: ${IMAGE_MODEL}`);
    
    const response = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: `Educational illustration: ${prompt}`,
      size: IMAGE_SIZE as '256x256' | '512x512' | '1024x1024',
      n: 1,
    });
    
    const imageUrl = response.data?.[0]?.url;
    if (imageUrl) {
      console.log(`✅ Successfully generated 256x256 image`);
      return { imageUrl };
    }
    throw new Error('No image URL returned');
  } catch (error) {
    console.error(`❌ Image generation failed:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, prompts, batchSize = 10, courseId, moduleIndex, slideIndex } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Check if S3 is configured
    const s3Configured = !!(
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY && 
      process.env.S3_BUCKET_NAME
    );

    if (!s3Configured) {
      console.warn('⚠️ S3 not configured, images will not be persisted');
    }

    // Handle batch generation if multiple prompts provided
    if (prompts && Array.isArray(prompts)) {
      const allImages: string[] = [];
      
      console.log(`🚀 Starting batch generation for ${prompts.length} 256x256 images`);
      
      // Process in batches to respect rate limits and API constraints
      const maxBatchSize = Math.min(batchSize, 10);
      
      for (let i = 0; i < prompts.length; i += maxBatchSize) {
        const batch = prompts.slice(i, i + maxBatchSize);
        
        console.log(`Processing batch ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(prompts.length / maxBatchSize)}`);
        
        // Generate images for this batch in parallel
        const batchPromises = batch.map((promptText: string) =>
          generateImage(promptText)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // Collect results
        batchResults.forEach(result => {
          if (result.imageUrl) {
            allImages.push(result.imageUrl);
          }
        });
        
        // Add small delay between batches to respect rate limits
        if (i + maxBatchSize < prompts.length) {
          console.log('⏳ Waiting 1.2s between batches...');
          await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 second delay
        }
      }
      
      console.log(`✅ Generated ${allImages.length}/${prompts.length} images successfully`);
      
      return NextResponse.json({ 
        imageUrls: allImages, 
        totalGenerated: allImages.length,
        totalRequested: prompts.length
      });
    }

    // Single image generation (fallback for existing functionality)
    if (!prompt) {
      return NextResponse.json(
        { error: 'Image prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateImage(prompt);
    let finalImageUrl = result.imageUrl;

    // Upload to S3 if configured and course info is provided
    if (s3Configured && courseId) {
      try {
        const s3Key = generateS3Key(courseId, moduleIndex || 0, slideIndex ?? 'cover');
        finalImageUrl = await uploadImageToS3(result.imageUrl, s3Key);
        console.log(`🎯 Image uploaded to S3: ${finalImageUrl}`);
      } catch (s3Error) {
        console.error('Failed to upload to S3, using OpenAI URL:', s3Error);
        // Fall back to OpenAI URL if S3 upload fails
      }
    }
    
    return NextResponse.json({ 
      imageUrl: finalImageUrl, 
      modelUsed: IMAGE_MODEL 
    });
  } catch (error) {
    console.error('💥 Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 