// This is a mock implementation for the prototype
// In a real app, this would call OpenAI and image generation APIs

import { v4 as uuidv4 } from "uuid"
import { Story } from "@/types/story"

type StoryInput = {
  age: string
  characters: string
  setting: string
  moral: string
  length: string
}

type ContinuationInput = {
  storyId: string
  recap: string
  newCharacters: string
  newSetting: string
  newMoral: string
}

type StoryData = {
  id: string
  title: string
  content: string
  images: string[]
}

// Function to generate a story using the API
export async function generateStory(
  input: {
    age: string;
    characters: string;
    setting: string;
    moral: string;
    length: "short" | "medium" | "long";
  }
): Promise<Story> {
  try {
    const { age, characters, setting, moral, length } = input;
    console.log("Generating story with params:", { age, characters, setting, moral, length })
    
    const response = await fetch("/api/generate-story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        age,
        characters,
        setting,
        moral,
        length,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API Error:", errorData)
      throw new Error(errorData.error || "Failed to generate story")
    }

    const data = await response.json()
    console.log("Story generated successfully:", data)
    return data
  } catch (error) {
    console.error("Error in generateStory:", error)
    throw error
  }
}

// Function to generate a story continuation
export async function generateContinuation(
  input: {
    story: Story;
    prompt: string;
    newCharacters?: string;
    newSetting?: string;
    newMoral?: string;
  }
): Promise<Story> {
  try {
    const { story, prompt, newCharacters, newSetting, newMoral } = input;
    console.log("Generating continuation for story:", story.id)
    
    // Ensure we have content to work with
    if (!story.content) {
      throw new Error("Previous story content is required for continuation")
    }

    // Generate a brief recap from the previous story
    const previousContent = story.content
    const recap = previousContent.length > 200 
      ? previousContent.slice(0, 200) + "..."
      : previousContent

    // Extract characters and setting from the previous story if available
    // Use new parameters if provided, otherwise fall back to previous story metadata
    const characters = newCharacters || story.metadata?.characters || "same characters"
    const setting = newSetting || story.metadata?.setting || "same setting"
    const moral = newMoral || story.metadata?.moral || "continuing the previous lesson"

    console.log("Using story details:", { 
      characters, 
      setting, 
      moral,
      usingNewCharacters: !!newCharacters,
      usingNewSetting: !!newSetting,
      usingNewMoral: !!newMoral
    })

    const response = await fetch("/api/generate-story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        age: "5-10", // Default age range for continuation
        characters,
        setting,
        moral,
        length: "medium",
        continuation: true,
        previousStory: recap,
        prompt,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API Error:", errorData)
      throw new Error(errorData.error || "Failed to generate continuation")
    }

    const data = await response.json()
    console.log("Continuation generated successfully:", data)
    return data
  } catch (error) {
    console.error("Error in generateContinuation:", error)
    throw error
  }
}

