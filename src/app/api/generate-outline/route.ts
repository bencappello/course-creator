import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ModuleOutline {
  title: string;
  description: string;
}

export async function POST(request: NextRequest) {
  console.log('🔸 Generate outline endpoint called');
  console.log('🔸 API Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('🔸 API Key first 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10));
  
  try {
    const { prompt, numModules, depth } = await request.json();
    console.log('🔸 Request body:', { prompt, numModules, depth });

    if (!process.env.OPENAI_API_KEY) {
      console.error('🔸 OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create a system prompt for course outline generation
    const systemPrompt = `You are an expert course designer. Create a structured course outline based on the user's request.
    
    The course should have exactly ${numModules} modules.
    Each module should have a clear title and description.
    The content depth is: ${depth}
    
    Return the response as a JSON array of modules, where each module has:
    - title: string (the module title)
    - description: string (a brief description of what the module covers)
    
    Example format:
    [
      {
        "title": "Introduction to Topic",
        "description": "Overview of key concepts and foundations"
      },
      {
        "title": "Advanced Concepts",
        "description": "Deep dive into complex aspects"
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a course outline for: ${prompt}` }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the response and ensure it's in the correct format
    const parsedContent = JSON.parse(content);
    const modules = parsedContent.modules || parsedContent.outline || parsedContent;
    
    // Ensure we have an array
    const moduleArray = Array.isArray(modules) ? modules : [modules];
    
    // Validate and clean the modules
    const validModules = moduleArray.slice(0, numModules).map((module: ModuleOutline) => ({
      title: module.title || 'Untitled Module',
      description: module.description || ''
    }));

    console.log('🔸 Returning modules:', validModules);
    return NextResponse.json(validModules);
  } catch (error) {
    console.error('🔸 Error generating course outline:', error);
    console.error('🔸 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to generate course outline' },
      { status: 500 }
    );
  }
} 