import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeneratedModule {
  title: string;
  slides: GeneratedSlide[];
  quiz: GeneratedQuizQuestion[];
}

interface GeneratedSlide {
  title: string;
  image_prompt: string;
  content: {
    summary: string;
    details: string[];
    deep_dive: string[];
  };
}

interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, outline, contentDepth } = await request.json();

    const oneShotExample = `{
      "title": "Example Slide Title",
      "image_prompt": "An example image prompt.",
      "content": {
        "summary": "A brief, one-paragraph overview of the topic.",
        "details": [
          "A more detailed paragraph expanding on the summary.",
          "Another paragraph providing more specifics and context."
        ],
        "deep_dive": [
          "A highly detailed paragraph with nuanced information for experts.",
          "Another comprehensive paragraph with advanced concepts."
        ]
      }
    }`;

    const courseSchema = {
      type: "OBJECT",
      properties: {
        cover: {
          type: "OBJECT",
          properties: {
            image_prompt: { type: "STRING" }
          },
          required: ["image_prompt"]
        },
        modules: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              slides: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    image_prompt: { type: "STRING" },
                    content: {
                      type: "OBJECT",
                      properties: {
                        summary: { type: "STRING" },
                        details: { type: "ARRAY", items: { type: "STRING" } },
                        deep_dive: { type: "ARRAY", items: { type: "STRING" } }
                      },
                      required: ["summary", "details", "deep_dive"]
                    }
                  },
                  required: ["title", "image_prompt", "content"]
                }
              },
              quiz: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    question: { type: "STRING" },
                    options: { type: "ARRAY", items: { type: "STRING" } },
                    correct_answer: { type: "STRING" }
                  },
                  required: ["question", "options", "correct_answer"]
                }
              }
            },
            required: ["title", "slides", "quiz"]
          }
        }
      },
      required: ["cover", "modules"]
    };

    const coursePrompt = `You are an expert instructional designer. Generate a complete course with the following outline: ${JSON.stringify(outline)}.
    
    IMPORTANT: Your output must EXACTLY follow this JSON structure. Every slide MUST include content with summary, details (array), and deep_dive (array).
    
    Here's an example slide structure: ${oneShotExample}
    
    For EACH module, create:
    - 3-5 informative slides with comprehensive content (summary + details + deep_dive)
    - A 5-question multiple choice quiz
    
    Requirements:
    - Generate engaging, educational content
    - Include diverse quiz questions testing key concepts
    - Create descriptive image prompts for visual learning
    - Ensure logical flow within and between modules
    
    Output ONLY valid JSON matching the specified schema.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: coursePrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: courseSchema
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content generated');
    }

    const parsedCourse = JSON.parse(content);
    
    // Add metadata
    const fullCourse = {
      id: Date.now().toString(),
      prompt,
      depth: contentDepth || 'Low',
      cover: {
        ...parsedCourse.cover,
        imageUrl: '' // Will be generated separately
      },
      modules: parsedCourse.modules.map((module: GeneratedModule) => ({
        ...module,
        slides: module.slides.map((slide: GeneratedSlide) => ({
          ...slide,
          imageUrl: '' // Will be generated separately
        }))
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(fullCourse);

  } catch (error) {
    console.error('Course generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate course' },
      { status: 500 }
    );
  }
} 