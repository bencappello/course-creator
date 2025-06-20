import { NextRequest, NextResponse } from 'next/server';

const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const response = await fetch(`${IMAGEN_API_URL}?key=${process.env.IMAGEN_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }
      })
    });

    if (!response.ok) {
      throw new Error(`Imagen API error: ${response.statusText}`);
    }

    const result = await response.json();
    const imageData = result.predictions?.[0]?.bytesBase64Encoded;
    
    if (!imageData) {
      throw new Error('No image data generated');
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageData}`
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 