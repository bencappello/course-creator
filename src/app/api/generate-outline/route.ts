import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { prompt, numModules } = await request.json();

    const outlineSchema = {
      type: "OBJECT",
      properties: {
        modules: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["modules"]
    };

    const outlinePrompt = `You are an expert instructional designer. A user wants a course on: "${prompt}". Generate a course outline with exactly ${numModules} module titles and a one-sentence description for each. Focus on a logical progression for a beginner. Output ONLY in the specified JSON format.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: outlinePrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: outlineSchema
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

    const parsedContent = JSON.parse(content);
    return NextResponse.json(parsedContent);

  } catch (error) {
    console.error('Outline generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate outline' },
      { status: 500 }
    );
  }
} 