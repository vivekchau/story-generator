import { NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: "https://api.fireworks.ai/inference/v1",
  apiKey: process.env.FIREWORKS_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { age, characters, setting, moral, length, continuation, previousStory, prompt } = body

    if (!process.env.FIREWORKS_API_KEY) {
      throw new Error("Fireworks API key is not configured")
    }

    // Calculate target word count based on length
    const wordCount = length === "short" ? 150 : length === "medium" ? 300 : 500

    // Create the prompt for the story
    let storyPrompt = ""
    
    if (continuation && previousStory) {
      // Create a continuation prompt
      storyPrompt = `Continue the following children's bedtime story with the same characters and setting:

Previous story:
${previousStory}

Additional context for continuation:
${prompt || "Continue the story naturally"}

Requirements for the continuation:
- Age range: ${age} years old
- Main characters: ${characters}
- Setting: ${setting}
- Moral lesson: ${moral}
- Target length: approximately ${wordCount} words
- Style: engaging, age-appropriate, with clear moral lesson
- Format: Include paragraphs separated by newlines
- Tone: warm, comforting, and suitable for bedtime reading
- Important: Maintain continuity with the previous story, using the same characters and setting
- If new characters, setting, or moral are specified, incorporate them naturally into the continuation`
    } else {
      // Create a new story prompt
      storyPrompt = `Create a children's bedtime story with the following requirements:
- Age range: ${age} years old
- Main characters: ${characters}
- Setting: ${setting}
- Moral lesson: ${moral}
- Target length: approximately ${wordCount} words
- Style: engaging, age-appropriate, with clear moral lesson
- Format: Include paragraphs separated by newlines
- Tone: warm, comforting, and suitable for bedtime reading`
    }

    console.log("Sending prompt to OpenAI:", storyPrompt)

    // Generate the story and title in parallel
    const [storyCompletion, titleCompletion] = await Promise.all([
      openai.chat.completions.create({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        messages: [
          {
            role: "system",
            content: continuation 
              ? "You are a creative children's story writer who specializes in creating engaging, age-appropriate bedtime stories with clear moral lessons. You excel at continuing stories while maintaining consistency with the original characters and setting. When new characters, settings, or morals are introduced, you incorporate them naturally into the story."
              : "You are a creative children's story writer who specializes in creating engaging, age-appropriate bedtime stories with clear moral lessons."
          },
          {
            role: "user",
            content: storyPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
      openai.chat.completions.create({
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a creative title generator for children's stories. Generate exactly ONE short, engaging title. Do not provide multiple options or suggestions. Return only the title itself, nothing else."
          },
          {
            role: "user",
            content: `Generate a single, short, engaging title for a children's story about ${characters} in ${setting} that teaches about ${moral}. Return only the title, no explanations or multiple options.`
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      })
    ])

    // Get the story content and title
    const storyContent = storyCompletion.choices[0].message.content?.trim() || ""
    let title = titleCompletion.choices[0].message.content?.trim() || "The Adventure Begins"
    
    // Clean the title to ensure it's just one title
    // Remove any numbering, bullet points, or multiple options
    title = title
      .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
      .replace(/^[-*]\s*/, '') // Remove leading dashes or asterisks
      .replace(/^[A-Z]\.\s*/, '') // Remove leading letters like "A. "
      .split('\n')[0] // Take only the first line
      .split(' - ')[0] // Take only the first part if separated by dashes
      .split(' or ')[0] // Take only the first part if separated by "or"
      .trim()
    
    // If the title is empty after cleaning, use a default
    if (!title || title.length < 2) {
      title = "The Adventure Begins"
    }
    
    const storyId = crypto.randomUUID()

    // Generate the first image immediately to show something quickly
    let firstImage = "/placeholder.svg"
    try {
      const mainImagePrompt = `Create a child-friendly illustration for a bedtime story. The image should feature ${characters} in ${setting}. The style should be colorful, gentle, and appropriate for children aged ${age}. The illustration should be suitable for a story about ${moral}.`
      
      console.log("Generating first image with prompt:", mainImagePrompt)
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: mainImagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      })
      
      if (imageResponse.data && imageResponse.data.length > 0) {
        firstImage = imageResponse.data[0].url || "/placeholder.svg"
      }
    } catch (error) {
      console.error("Error generating first image:", error)
    }

    // Return the story with the first image
    const initialResponse = {
      id: storyId,
      title,
      content: storyContent,
      images: [firstImage], // Include the first image
      imageStatus: "generating", // Indicate that more images are being generated
      remainingImageCount: length === "short" ? 1 : length === "medium" ? 2 : 4 // How many more images to generate
    }

    return NextResponse.json(initialResponse)
  } catch (error) {
    console.error("Error generating story:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate story" },
      { status: 500 }
    )
  }
}

// Function to generate images in the background
async function generateImagesInBackground(
  storyId: string,
  storyContent: string,
  characters: string,
  setting: string,
  moral: string,
  age: string,
  length: string
) {
  try {
    const paragraphs = storyContent.split("\n\n").filter(p => p.trim().length > 0)
    
    // Determine how many images to generate based on story length
    const imageCount = length === "short" ? 2 : length === "medium" ? 3 : 5
    
    // Generate image prompts for key scenes in the story
    const imagePrompts = []
    
    // Generate a prompt for the main characters and setting
    const mainImagePrompt = `Create a child-friendly illustration for a bedtime story. The image should feature ${characters} in ${setting}. The style should be colorful, gentle, and appropriate for children aged ${age}. The illustration should be suitable for a story about ${moral}.`
    imagePrompts.push(mainImagePrompt)
    
    // Generate additional image prompts based on story paragraphs
    for (let i = 1; i < imageCount; i++) {
      // Select a paragraph from the story to base the image on
      const paragraphIndex = Math.floor((i / imageCount) * paragraphs.length)
      const paragraph = paragraphs[paragraphIndex] || ""
      
      // Create a prompt based on the paragraph content, ensuring character consistency
      const imagePrompt = `Create a child-friendly illustration for a bedtime story featuring ${characters}. The image should be based on this scene: "${paragraph.substring(0, 100)}...". The style should be colorful, gentle, and appropriate for children aged ${age}. The illustration should be suitable for a story about ${moral}. Make sure to maintain visual consistency with the previous illustrations of ${characters}.`
      imagePrompts.push(imagePrompt)
    }
    
    // Generate images one by one and update the story in localStorage as each image is ready
    for (let i = 0; i < imagePrompts.length; i++) {
      try {
        console.log(`Generating image ${i+1}/${imagePrompts.length} with prompt:`, imagePrompts[i])
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompts[i],
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "vivid",
        })
        
        if (imageResponse.data && imageResponse.data.length > 0) {
          const imageUrl = imageResponse.data[0].url || ""
          
          // Update the story in localStorage with the new image
          updateStoryWithImage(storyId, i, imageUrl)
        }
      } catch (error) {
        console.error(`Error generating image ${i+1}:`, error)
        // Update the story with a placeholder for failed images
        updateStoryWithImage(storyId, i, "/placeholder.svg")
      }
    }
    
    // Mark all images as generated
    updateStoryImageStatus(storyId, "complete")
  } catch (error) {
    console.error("Error in background image generation:", error)
    updateStoryImageStatus(storyId, "error")
  }
}

// Helper function to update a story with a new image
function updateStoryWithImage(storyId: string, imageIndex: number, imageUrl: string) {
  try {
    // Get the current story from localStorage
    const storyJson = localStorage.getItem(`story_${storyId}`)
    if (storyJson) {
      const story = JSON.parse(storyJson)
      
      // Ensure the images array exists and has enough elements
      if (!story.images) {
        story.images = []
      }
      
      // Update or add the image at the specified index
      story.images[imageIndex] = imageUrl
      
      // Save the updated story back to localStorage
      localStorage.setItem(`story_${storyId}`, JSON.stringify(story))
    }
  } catch (error) {
    console.error("Error updating story with image:", error)
  }
}

// Helper function to update the image generation status
function updateStoryImageStatus(storyId: string, status: "generating" | "complete" | "error") {
  try {
    // Get the current story from localStorage
    const storyJson = localStorage.getItem(`story_${storyId}`)
    if (storyJson) {
      const story = JSON.parse(storyJson)
      
      // Update the image status
      story.imageStatus = status
      
      // Save the updated story back to localStorage
      localStorage.setItem(`story_${storyId}`, JSON.stringify(story))
    }
  } catch (error) {
    console.error("Error updating story image status:", error)
  }
} 