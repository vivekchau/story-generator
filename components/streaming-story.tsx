"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Home, Save, Wand2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

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

interface StreamingStoryProps {
  storyId: string
  initialContent: string
  initialTitle: string
  metadata: StoryMetadata
}

export default function StreamingStory({ storyId, initialContent, initialTitle, metadata }: StreamingStoryProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [story, setStory] = useState<StoryData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({})
  const [loadedImages, setLoadedImages] = useState<Record<number, string>>({})
  const [imageStatus, setImageStatus] = useState<"generating" | "complete" | "error">("generating")
  const [remainingImageCount, setRemainingImageCount] = useState(0)
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const [paragraphs, setParagraphs] = useState<string[]>([])

  useEffect(() => {
    // Initialize story with initial content
    const initialStory: StoryData = {
      id: storyId,
      title: initialTitle,
      content: initialContent,
      metadata,
      images: [],
      imageStatus: "generating",
      remainingImageCount: 2 // Start with 2 images
    }
    setStory(initialStory)
    setRemainingImageCount(2)

    // Save initial story to localStorage
    localStorage.setItem("currentStory", JSON.stringify(initialStory))
    localStorage.setItem(`story_${storyId}`, JSON.stringify(initialStory))

    // Parse paragraphs once
    const parsedParagraphs = initialContent.split("\n\n").filter(p => p.trim().length > 0)
    setParagraphs(parsedParagraphs)
    
    // Start with empty content
    setDisplayedContent("")
    setCurrentParagraphIndex(0)
  }, [storyId, initialContent, initialTitle, metadata])

  // Separate effect for streaming content
  useEffect(() => {
    if (paragraphs.length === 0 || currentParagraphIndex >= paragraphs.length) return
    
    const streamInterval = setInterval(() => {
      setDisplayedContent(prev => {
        // Only add the current paragraph if we haven't reached the end
        if (currentParagraphIndex < paragraphs.length) {
          return prev + paragraphs[currentParagraphIndex] + "\n\n"
        }
        return prev
      })
      
      setCurrentParagraphIndex(prev => prev + 1)
      
      // Clear interval when we've displayed all paragraphs
      if (currentParagraphIndex >= paragraphs.length - 1) {
        clearInterval(streamInterval)
      }
    }, 1000) // Display a new paragraph every second

    return () => clearInterval(streamInterval)
  }, [paragraphs, currentParagraphIndex])

  // Function to generate additional images
  const generateAdditionalImages = async () => {
    if (!story || remainingImageCount <= 0) return

    try {
      const paragraphs = story.content.split("\n\n").filter(p => p.trim().length > 0)
      const currentImageCount = story.images.length
      
      // Generate next image
      const paragraphIndex = Math.floor((currentImageCount / (currentImageCount + remainingImageCount)) * paragraphs.length)
      const paragraph = paragraphs[paragraphIndex] || ""
      
      const imagePrompt = `Create a child-friendly illustration for a bedtime story featuring ${story.metadata?.characters}. The image should be based on this scene: "${paragraph.substring(0, 100)}...". The style should be colorful, gentle, and appropriate for children aged ${story.metadata?.age}. The illustration should be suitable for a story about ${story.metadata?.moral}. Make sure to maintain visual consistency with the previous illustrations of ${story.metadata?.characters}.`
      
      console.log("Generating image with prompt:", imagePrompt)
      
      // Try to generate image, but use a fallback if it fails
      let newImageUrl = "/placeholder.svg"
      
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: imagePrompt }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Image generation failed:", response.status, errorData)
          throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.imageUrl) {
          console.error("No image URL in response:", data)
          throw new Error("No image URL returned from the server")
        }
        
        newImageUrl = data.imageUrl
        console.log("Successfully generated image:", newImageUrl)
      } catch (imageError) {
        console.error("Error in image generation, using fallback:", imageError)
        // Continue with the fallback image
      }

      // Update story with new image (even if it's a fallback)
      const updatedStory = {
        ...story,
        images: [...story.images, newImageUrl],
        remainingImageCount: remainingImageCount - 1
      }

      // Save to localStorage
      localStorage.setItem("currentStory", JSON.stringify(updatedStory))
      localStorage.setItem(`story_${story.id}`, JSON.stringify(updatedStory))

      // Update state
      setStory(updatedStory)
      setRemainingImageCount(prev => prev - 1)

      // Load the new image
      const img = new window.Image()
      img.onload = () => {
        setLoadedImages(prev => ({
          ...prev,
          [currentImageCount]: newImageUrl
        }))
        setLoadingImages(prev => ({
          ...prev,
          [currentImageCount]: false
        }))
      }
      img.onerror = () => {
        console.error("Failed to load image:", newImageUrl)
        setLoadedImages(prev => ({
          ...prev,
          [currentImageCount]: "/placeholder.svg"
        }))
        setLoadingImages(prev => ({
          ...prev,
          [currentImageCount]: false
        }))
      }
      img.src = newImageUrl

      // If this was the last image, update status
      if (remainingImageCount === 1) {
        setImageStatus("complete")
        const finalStory: StoryData = {
          ...updatedStory,
          imageStatus: "complete" as const
        }
        localStorage.setItem("currentStory", JSON.stringify(finalStory))
        localStorage.setItem(`story_${story.id}`, JSON.stringify(finalStory))
        setStory(finalStory)
      }
    } catch (error) {
      console.error("Error generating additional image:", error)
      
      // Show a toast notification to the user
      toast({
        title: "Image Generation Failed",
        description: "We couldn't generate an illustration for your story. Please try again later.",
        variant: "destructive",
      })
      
      // Update the image status to error
      setImageStatus("error")
      
      // Update the story in localStorage with the error status
      if (story) {
        const errorStory: StoryData = {
          ...story,
          imageStatus: "error" as const
        }
        localStorage.setItem("currentStory", JSON.stringify(errorStory))
        localStorage.setItem(`story_${story.id}`, JSON.stringify(errorStory))
        setStory(errorStory)
      }
    }
  }

  // Set up polling for additional images
  useEffect(() => {
    if (!story || remainingImageCount <= 0 || imageStatus !== "generating") return

    // Generate next image after a delay
    const timer = setTimeout(() => {
      generateAdditionalImages()
    }, 2000)

    return () => clearTimeout(timer)
  }, [story, remainingImageCount, imageStatus])

  const saveStory = () => {
    if (!story) return

    setIsSaving(true)

    try {
      // Save the story with a unique key
      localStorage.setItem(`story_${story.id}`, JSON.stringify(story))

      toast({
        title: "Story saved!",
        description: "Your story has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving story:", error)
      toast({
        title: "Error saving story",
        description: "There was a problem saving your story.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const continueThisStory = () => {
    if (!story) return

    // Save the current story first
    saveStory()

    // Navigate to continue page
    router.push("/continue")
  }

  if (!story) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">Loading your story...</div>
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8 mx-auto">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">{story.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={saveStory} disabled={isSaving}>
            <Save className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-8">
              {imageStatus === "generating" && (
                <div className="flex flex-col items-center justify-center my-6 bg-muted p-4 rounded-lg">
                  <div className="text-muted-foreground animate-pulse mb-2">
                    Generating illustrations for your story...
                  </div>
                  <div className="w-full max-w-xs bg-background rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${story && story.images ? 
                          Math.round((story.images.length / (story.images.length + remainingImageCount)) * 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {story && story.images ? story.images.length : 0} of {story && story.images ? story.images.length + remainingImageCount : 0} images generated
                  </div>
                </div>
              )}
              
              {imageStatus === "error" && (
                <div className="flex flex-col items-center justify-center my-6 bg-destructive/10 p-4 rounded-lg">
                  <div className="text-destructive mb-2">
                    Some illustrations couldn't be generated
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setImageStatus("generating")
                      setRemainingImageCount(2) // Try to generate 2 more images
                      if (story) {
                        const updatedStory = {
                          ...story,
                          imageStatus: "generating" as const,
                          remainingImageCount: 2
                        }
                        localStorage.setItem("currentStory", JSON.stringify(updatedStory))
                        localStorage.setItem(`story_${story.id}`, JSON.stringify(updatedStory))
                        setStory(updatedStory)
                      }
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {paragraphs.map((paragraph, index) => {
                // Only show paragraphs that have been "streamed" so far
                if (index > currentParagraphIndex) return null;
                
                // Display an image after every 1-2 paragraphs, if available
                const shouldShowImage = story.images && story.images[Math.floor(index / 2)] && index % 2 === 1
                const imageIndex = Math.floor(index / 2)

                return (
                  <div key={index} className="space-y-6">
                    <p className="leading-7">{paragraph}</p>

                    {shouldShowImage && (
                      <div className="flex justify-center my-6">
                        <div className="relative overflow-hidden rounded-lg w-full max-w-md aspect-[4/3]">
                          {loadingImages[imageIndex] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                              <div className="text-muted-foreground">Loading image...</div>
                            </div>
                          )}
                          {loadedImages[imageIndex] && (
                            <Image
                              src={loadedImages[imageIndex]}
                              alt={`Illustration for ${story.title}`}
                              fill
                              className="object-cover"
                              priority={imageIndex === 0} // Prioritize loading the first image
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/create")}>
            <Wand2 className="w-4 h-4 mr-2" />
            Create New Story
          </Button>

          <Button className="w-full sm:w-auto" onClick={continueThisStory}>
            <BookOpen className="w-4 h-4 mr-2" />
            Continue This Story
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 