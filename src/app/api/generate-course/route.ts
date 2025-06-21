import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CourseModule, Course } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OutlineModule {
  title: string;
  description: string;
}

// Direct batch image generation function
async function generateImagesDirectly(prompts: string[]): Promise<string[]> {
  const IMAGE_MODELS = [
    'gpt-4.1',
    'dall-e-3',
    'dall-e-2',
  ];
  
  const results: string[] = [];
  
  for (const prompt of prompts) {
    let imageGenerated = false;
    
    for (const model of IMAGE_MODELS) {
      try {
        console.log(`🖼️ Trying ${model} for prompt: "${prompt.substring(0, 50)}..."`);
        
        const response = await openai.images.generate({
          model: model as Parameters<typeof openai.images.generate>[0]['model'],
          prompt: `Educational illustration: ${prompt}`,
          size: '512x512',
          n: 1,
        });
        
        const imageUrl = response.data?.[0]?.url;
        if (imageUrl) {
          console.log(`✅ Success with ${model}`);
          results.push(imageUrl);
          imageGenerated = true;
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ ${model} failed:`, errorMessage.substring(0, 100));
      }
    }
    
    if (!imageGenerated) {
      console.log(`⚠️ Failed to generate image for prompt: "${prompt.substring(0, 50)}..."`);
      results.push(''); // Push empty string to maintain array indices
    }
  }
  
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔸 Generate course request received:', {
      hasPrompt: !!body.prompt,
      hasOutline: !!body.outline,
      hasDepth: !!body.depth,
      outlineLength: body.outline?.length
    });
    
    const { prompt, outline, depth } = body;

    if (!process.env.OPENAI_API_KEY) {
      console.error('🔸 OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

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

    // Collect all image prompts for batch generation
    const allImagePrompts: string[] = [];
    const imagePromptMap: { [key: string]: number } = {};
    
    // Add cover image prompt
    const coverImagePrompt = coverContent.imagePrompt || 'A professional course cover image';
    allImagePrompts.push(coverImagePrompt);
    imagePromptMap['cover'] = 0;
    
    // Add slide image prompts
    modules.forEach((module, moduleIndex) => {
      module.slides?.forEach((slide, slideIndex: number) => {
        if (slide.image_prompt) {
          const promptIndex = allImagePrompts.length;
          allImagePrompts.push(slide.image_prompt);
          imagePromptMap[`module-${moduleIndex}-slide-${slideIndex}`] = promptIndex;
        }
      });
    });

    // Generate all images in batch (optional - don't fail course generation if images fail)
    let generatedImages: string[] = [];
    const SKIP_IMAGES = process.env.SKIP_IMAGE_GENERATION === 'true';
    
    if (allImagePrompts.length > 0 && !SKIP_IMAGES) {
      try {
        console.log(`🎨 Starting batch image generation for ${allImagePrompts.length} images`);
        console.log(`🎨 Note: Images are optional. Course will be created even if image generation fails.`);
        
        // Add a timeout to prevent hanging
        const imageGenerationPromise = generateImagesDirectly(allImagePrompts);
        const timeoutPromise = new Promise<string[]>((resolve) => {
          setTimeout(() => {
            console.log('⏰ Image generation timeout - proceeding without images');
            resolve(new Array(allImagePrompts.length).fill(''));
          }, 30000); // 30 second timeout
        });
        
        // Race between image generation and timeout
        generatedImages = await Promise.race([imageGenerationPromise, timeoutPromise]);
        
        console.log(`🎨 Image generation complete:`, {
          requested: allImagePrompts.length,
          generated: generatedImages.filter(url => url !== '').length
        });
      } catch (error) {
        console.error('🎨 Batch image generation error:', error);
        // Initialize with empty strings to maintain indices
        generatedImages = new Array(allImagePrompts.length).fill('');
      }
    } else if (SKIP_IMAGES) {
      console.log('🎨 Skipping image generation (SKIP_IMAGE_GENERATION=true)');
      generatedImages = new Array(allImagePrompts.length).fill('');
    }

    console.log(`📚 Creating course with ${modules.length} modules and ${generatedImages.filter(url => url !== '').length} images`);

    // Create the full course object with generated images
    const course: Course = {
      id: Date.now().toString(),
      prompt: prompt || 'Untitled Course',  // Use the original user prompt
      depth: depth as 'Low' | 'Medium' | 'High',
      cover: {
        imageUrl: generatedImages[imagePromptMap['cover']] || '',
        image_prompt: coverImagePrompt
      },
      modules: modules.map((module, moduleIndex) => ({
        ...module,
        slides: module.slides?.map((slide, slideIndex: number) => ({
          ...slide,
          imageUrl: generatedImages[imagePromptMap[`module-${moduleIndex}-slide-${slideIndex}`]] || ''
        })) || []
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json(
      { error: 'Failed to generate course content' },
      { status: 500 }
    );
  }
} 