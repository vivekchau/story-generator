import { NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { age, characters, setting, moral, length } = body

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured")
    }

    // Calculate target word count based on length
    const wordCount = length === "short" ? 150 : length === "medium" ? 300 : 500

    // Create the prompt for the story
    const prompt = `Create a children's bedtime story with the following requirements:
- Age range: ${age} years old
- Main characters: ${characters}
- Setting: ${setting}
- Moral lesson: ${moral}
- Target length: approximately ${wordCount} words
- Style: engaging, age-appropriate, with clear moral lesson
- Format: Include paragraphs separated by newlines
- Tone: warm, comforting, and suitable for bedtime reading`

    // Generate the story using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a creative children's story writer who specializes in creating engaging, age-appropriate bedtime stories with clear moral lessons."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Generate a title for the story
    const titleCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a creative title generator for children's stories."
        },
        {
          role: "user",
          content: `Generate a short, engaging title for a children's story about ${characters} in ${setting} that teaches about ${moral}.`
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
    })

    // For now, we'll use placeholder images
    // In a real app, you would generate images using DALL-E or another image generation API
    const imageCount = length === "short" ? 2 : length === "medium" ? 3 : 5
    const images = Array(imageCount).fill("/placeholder.svg")

    return NextResponse.json({
      id: crypto.randomUUID(),
      title: titleCompletion.choices[0].message.content?.trim() || "The Adventure Begins",
      content: completion.choices[0].message.content?.trim() || "",
      images,
    })
  } catch (error) {
    console.error("Error generating story:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate story" },
      { status: 500 }
    )
  }
} 