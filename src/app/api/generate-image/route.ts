import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model priority list - try newer/faster models first based on latest 2025 OpenAI docs
const IMAGE_MODELS = [
  'dall-e-3', // High quality but slower
  'dall-e-2', // Fallback option - supports 512x512
];

async function generateImageWithFallback(prompt: string, size: string = '512x512') {
  let lastError;
  
  for (const model of IMAGE_MODELS) {
    try {
      console.log(`Trying image generation with model: ${model}`);
      
      // Adjust size based on model capabilities
      let adjustedSize = size;
      if (model === 'dall-e-3' && size === '512x512') {
        adjustedSize = '1024x1024'; // DALL-E 3 doesn't support 512x512
      }
      
      const response = await openai.images.generate({
        model: model as Parameters<typeof openai.images.generate>[0]['model'],
        prompt: `Educational illustration: ${prompt}`,
        size: adjustedSize as '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024',
        n: 1,
      });
      
      const imageUrl = response.data?.[0]?.url;
      if (imageUrl) {
        console.log(`✅ Successfully generated image with model: ${model}`);
        return { imageUrl, modelUsed: model };
      }
    } catch (error: unknown) {
      console.log(`❌ Model ${model} failed:`, error instanceof Error ? error.message : 'Unknown error');
      lastError = error;
      
      // If it's a model not found error, try next model
      if (error instanceof Error && (
        error.message?.includes('model') || 
        error.message?.includes('not found')
      )) {
        continue;
      }
      
      // Check for HTTP status errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status === 404 || status === 400) {
          continue;
        }
      }
      
      // For other errors, break and return the error
      throw error;
    }
  }
  
  throw lastError || new Error('All image generation models failed');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, prompts, batchSize = 10 } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Handle batch generation if multiple prompts provided
    if (prompts && Array.isArray(prompts)) {
      const allImages: string[] = [];
      const modelUsage: { [key: string]: number } = {};
      
      console.log(`🚀 Starting batch generation for ${prompts.length} images`);
      
      // Process in batches to respect rate limits and API constraints
      const maxBatchSize = Math.min(batchSize, 10);
      
      for (let i = 0; i < prompts.length; i += maxBatchSize) {
        const batch = prompts.slice(i, i + maxBatchSize);
        
        console.log(`Processing batch ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(prompts.length / maxBatchSize)}`);
        
        // Generate images for this batch in parallel
        const batchPromises = batch.map((promptText: string) =>
          generateImageWithFallback(promptText, '512x512')
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // Collect results and track model usage
        batchResults.forEach(result => {
          if (result.imageUrl) {
            allImages.push(result.imageUrl);
            modelUsage[result.modelUsed] = (modelUsage[result.modelUsed] || 0) + 1;
          }
        });
        
        // Add small delay between batches to respect rate limits
        if (i + maxBatchSize < prompts.length) {
          console.log('⏳ Waiting 1.2s between batches...');
          await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 second delay
        }
      }
      
      console.log('📊 Model usage summary:', modelUsage);
      console.log(`✅ Generated ${allImages.length}/${prompts.length} images successfully`);
      
      return NextResponse.json({ 
        imageUrls: allImages, 
        modelUsage,
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

    const result = await generateImageWithFallback(prompt);
    console.log('✅ Single image generated with model:', result.modelUsed);
    
    return NextResponse.json({ 
      imageUrl: result.imageUrl, 
      modelUsed: result.modelUsed 
    });
  } catch (error) {
    console.error('💥 Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 