import { NextResponse } from "next/server"

//export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!process.env.FIREWORKS_API_KEY) {
      throw new Error("Fireworks API key is not configured")
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log("Generating image with prompt:", prompt)

    // Call Fireworks Stable Diffusion API
    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/stable-diffusion-xl-1024-v1-0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "image/jpeg",
          "Authorization": `Bearer ${process.env.FIREWORKS_API_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          height: 1024,
          width: 1024,
          seed: 0,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fireworks API error: ${errorText}`);
    }

    // Convert the image buffer to a base64 string for the frontend
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    )
  }
} 