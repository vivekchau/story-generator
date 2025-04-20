"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Story } from "@/types/story"
import StreamingStory from "@/components/streaming-story"

interface StoryMetadata {
  characters?: string
  setting?: string
  moral?: string
  length?: "short" | "medium" | "long"
  age?: string
}

interface StoryData {
  id: string
  title: string
  content: string
  metadata?: StoryMetadata
  images: string[]
  imageStatus?: "generating" | "complete" | "error"
  remainingImageCount?: number
}

export default function StoryPage() {
  const router = useRouter()
  const [storyId, setStoryId] = useState<string | null>(null)
  const [initialContent, setInitialContent] = useState<string>("")
  const [initialTitle, setInitialTitle] = useState<string>("Your Story")
  const [metadata, setMetadata] = useState<StoryMetadata>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we have a story ID in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id')
    
    if (id) {
      setStoryId(id)
      
      // Try to load the story from localStorage
      try {
        const storyJson = localStorage.getItem(`story_${id}`)
        if (storyJson) {
          const storyData = JSON.parse(storyJson) as StoryData
          setInitialContent(storyData.content)
          setInitialTitle(storyData.title)
          setMetadata(storyData.metadata || {})
        }
      } catch (error) {
        console.error("Error loading story:", error)
      }
    } else {
      // Check if we have a current story in localStorage
      try {
        const currentStoryJson = localStorage.getItem("currentStory")
        if (currentStoryJson) {
          const storyData = JSON.parse(currentStoryJson) as StoryData
          setStoryId(storyData.id)
          setInitialContent(storyData.content)
          setInitialTitle(storyData.title)
          setMetadata(storyData.metadata || {})
        } else {
          // No story found, redirect to home
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading current story:", error)
        router.push("/")
      }
    }
    
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Loading your story...</div>
        </div>
      </div>
    )
  }

  if (!storyId) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">No story found. Please create a new story.</div>
      </div>
    )
  }

  return (
    <StreamingStory 
      storyId={storyId}
      initialContent={initialContent}
      initialTitle={initialTitle}
      metadata={metadata}
    />
  )
}

