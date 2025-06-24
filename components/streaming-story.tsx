"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Home, Save, Wand2, BookOpen, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import jsPDF from 'jspdf'
import { useSession, signIn } from "next-auth/react"
import { DownloadButton } from "@/components/download-button"

interface StoryMetadata {
  characters?: string
  setting?: string
  moral?: string
  length?: "short" | "medium" | "long"
  age?: string
  tone?: string
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
  const { data: session } = useSession()
  const [story, setStory] = useState<StoryData | null>(null)
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({})
  const [loadedImages, setLoadedImages] = useState<Record<number, string>>({})
  const [imageStatus, setImageStatus] = useState<"generating" | "complete" | "error">("generating")
  const [remainingImageCount, setRemainingImageCount] = useState(0)
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    // Initialize story with initial content
    const initialStory: StoryData = {
      id: storyId,
      title: initialTitle,
      content: initialContent,
      metadata,
      images: [],
      imageStatus: "generating",
      remainingImageCount: getImageCountForLength(metadata.length) // Dynamic image count based on length
    }
    setStory(initialStory)
    setRemainingImageCount(getImageCountForLength(metadata.length))

    // Save initial story to localStorage
    saveStoryToStorage(initialStory, "currentStory")
    saveStoryToStorage(initialStory, `story_${storyId}`)

    // Parse paragraphs once
    const parsedParagraphs = initialContent.split("\n\n").filter(p => p.trim().length > 0)
    setParagraphs(parsedParagraphs)
    
    // Start with empty content
    setDisplayedContent("")
    setCurrentParagraphIndex(0)
  }, [storyId, initialContent, initialTitle, metadata])

  // Helper function to determine number of images based on story length
  const getImageCountForLength = (length?: "short" | "medium" | "long") => {
    switch (length) {
      case "short":
        return 2
      case "medium":
        return 4
      case "long":
        return 6
      default:
        return 2 // Default to short story length
    }
  }

  // Modified streaming effect
  useEffect(() => {
    if (paragraphs.length === 0 || currentParagraphIndex >= paragraphs.length) return
    
    const streamInterval = setInterval(() => {
      if (currentParagraphIndex < paragraphs.length) {
        setDisplayedContent(prev => prev + paragraphs[currentParagraphIndex] + "\n\n")
        setCurrentParagraphIndex(prev => prev + 1)
        
        if (currentParagraphIndex >= paragraphs.length - 1) {
          clearInterval(streamInterval)
        }
      } else {
        clearInterval(streamInterval)
      }
    }, 1000)

    return () => clearInterval(streamInterval)
  }, [paragraphs, currentParagraphIndex])

  // Function to safely save story to localStorage with error handling
  const saveStoryToStorage = (storyData: StoryData, key: string) => {
    try {
      // Create a storage-safe version without image URLs to prevent quota issues
      const storageSafeStory = {
        ...storyData,
        images: [] // Don't store image URLs in localStorage to save space
      }
      
      const storyJson = JSON.stringify(storageSafeStory)
      
      // Check if the data would exceed localStorage quota (rough estimate)
      if (storyJson.length > 5000000) { // 5MB limit
        console.warn("Story data too large for localStorage, skipping save")
        return false
      }
      
      localStorage.setItem(key, storyJson)
      return true
    } catch (error) {
      console.error("Failed to save story to localStorage:", error)
      // If localStorage is full, try to clear some old data
      try {
        // Clear old stories to make space
        const keys = Object.keys(localStorage)
        const storyKeys = keys.filter(key => key.startsWith('story_'))
        
        // Remove oldest stories (keep only the 5 most recent)
        if (storyKeys.length > 5) {
          storyKeys.slice(0, storyKeys.length - 5).forEach(key => {
            localStorage.removeItem(key)
          })
        }
        
        // Try saving again
        const storageSafeStory = {
          ...storyData,
          images: []
        }
        localStorage.setItem(key, JSON.stringify(storageSafeStory))
        return true
      } catch (retryError) {
        console.error("Failed to save story even after clearing space:", retryError)
        return false
      }
    }
  }

  // Function to generate additional images
  const generateAdditionalImages = async () => {
    if (!story || remainingImageCount <= 0) return

    try {
      const paragraphs = story.content.split("\n\n").filter(p => p.trim().length > 0)
      const currentImageCount = story.images.length
      const totalImages = getImageCountForLength(story.metadata?.length)
      
      // Generate next image
      const paragraphIndex = Math.floor((currentImageCount / totalImages) * paragraphs.length)
      const paragraph = paragraphs[paragraphIndex] || ""
      
      // Adjust image style based on tone
      let styleAdjustment = ""
      switch (story.metadata?.tone) {
        case "inspiring":
          styleAdjustment = "Use vibrant colors and dynamic compositions to create an uplifting and energetic scene. Focus on bold, inspiring visuals."
          break;
        case "silly":
          styleAdjustment = "Create a playful and whimsical scene with exaggerated features and fun elements. Use bright, cheerful colors and cartoonish style."
          break;
        default: // warm, comforting
          styleAdjustment = "Create a gentle scene with warm, soothing colors and soft, dreamy compositions. Focus on cozy and peaceful elements."
          break;
      }
      
      const imagePrompt = `Create a child-friendly illustration with absolutely NO text, words, numbers, or letters of any kind. Important: The image must be completely free of any written elements.

Scene description: A child-friendly illustration featuring ${story.metadata?.characters} in ${story.metadata?.setting}. The scene depicts: "${paragraph.substring(0, 100)}...".

Style instructions:
- ${styleAdjustment}
- Ensure the artwork is age-appropriate for ${story.metadata?.age || '2-4'} years
- Focus on clear, simple visual storytelling
- Maintain visual consistency with previous illustrations
- Use clean, uncluttered compositions
- NO text, symbols, or numbers anywhere in the image

The illustration should visually convey the story's message about ${story.metadata?.moral} through actions and expressions only.`
      
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

      // Save to localStorage safely
      saveStoryToStorage(updatedStory, "currentStory")
      saveStoryToStorage(updatedStory, `story_${story.id}`)

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
        saveStoryToStorage(finalStory, "currentStory")
        saveStoryToStorage(finalStory, `story_${story.id}`)
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
        saveStoryToStorage(errorStory, "currentStory")
        saveStoryToStorage(errorStory, `story_${story.id}`)
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

  const downloadPDF = async () => {
    try {
      // Check if user is authenticated
      if (!session) {
        toast({
          title: 'Error',
          description: 'Please sign in to download the story',
          variant: 'destructive'
        });
        return;
      }

      if (!story) {
        toast({
          title: 'Error',
          description: 'No story available to download',
          variant: 'destructive'
        });
        return;
      }

      setIsDownloading(true);
      const doc = new jsPDF();
      let y = 20;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = doc.internal.pageSize.width - 2 * margin;

      // Add title
      doc.setFontSize(20);
      doc.text(story.title, margin, y);
      y += lineHeight * 2;

      // Add story content with inline images
      doc.setFontSize(12);
      const paragraphs = story.content.split('\n\n');
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const lines = doc.splitTextToSize(paragraph, maxWidth);
        
        // Add paragraph text
        for (const line of lines) {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
        y += lineHeight;

        // Add image after every 1-2 paragraphs
        if (story.images && story.images[Math.floor(i / 2)] && i % 2 === 1) {
          const imageIndex = Math.floor(i / 2);
          const imageUrl = story.images[imageIndex];

          try {
            // Use proxy endpoint to fetch image
            const response = await fetch('/api/proxy-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: imageUrl }),
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const imageBlob = await response.blob();
            const imageData = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(imageBlob);
            });

            // Check if we need a new page for the image
            if (y > pageHeight - margin - 100) {
              doc.addPage();
              y = margin;
            }

            // Add image with proper dimensions
            const imgWidth = maxWidth;
            const imgHeight = (imgWidth * 9) / 16; // 16:9 aspect ratio
            doc.addImage(imageData as string, 'JPEG', margin, y, imgWidth, imgHeight);
            y += imgHeight + lineHeight * 2;
          } catch (error) {
            console.error('Error adding image to PDF:', error);
            // Continue with next paragraph if image fails
          }
        }
      }

      // Save the PDF
      doc.save(`${story.title}.pdf`);
      toast({
        title: 'Success',
        description: 'Story downloaded successfully!'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download story. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveStory = async () => {
    if (!session) {
      // Redirect to sign in
      signIn("google")
      return
    }

    setIsSaving(true)
    try {
      const session = await fetch('/api/auth/session')
      const sessionData = await session.json()
      console.log('Current session:', sessionData)

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: story?.title,
          content: story?.content,
          metadata: story?.metadata,
          images: story?.images,
        }),
      })

      console.log('Save response:', await response.json())

      if (!response.ok) throw new Error("Failed to save story")
      
      setIsSaved(true)
      toast({
        title: "Story Saved!",
        description: "You can find it in your My Stories collection.",
      })
    } catch (error) {
      console.error("Error saving story:", error)
      toast({
        title: "Error",
        description: "Failed to save the story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DownloadButton 
                      onDownload={downloadPDF}
                      disabled={isDownloading}
                      className={isDownloading ? "cursor-not-allowed opacity-50" : ""}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDownloading ? "Downloading PDF..." : "Download as PDF"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isSaved && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveStory}
                        disabled={isSaving}
                        className={isSaving ? "cursor-not-allowed opacity-50" : ""}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {session ? "Save Story" : "Sign in to Save"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
              
              {paragraphs.map((paragraph, index) => {
                // Only show paragraphs that have been "streamed" so far
                if (index > currentParagraphIndex) return null;
                
                // Display an image after every 1-2 paragraphs, if available
                const shouldShowImage = story.images && story.images[Math.floor(index / 2)] && index % 2 === 1
                const imageIndex = Math.floor(index / 2)

                return (
                  <div key={index} className="space-y-6">
                    <p className="leading-7 whitespace-pre-wrap">{paragraph}</p>

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
                setRemainingImageCount(getImageCountForLength(metadata.length))
                if (story) {
                  const updatedStory = {
                    ...story,
                    imageStatus: "generating" as const,
                    remainingImageCount: getImageCountForLength(metadata.length)
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

        <CardFooter className="flex justify-center">
          <Button className="w-full sm:w-auto" onClick={() => router.push("/create")}>
            <Wand2 className="w-4 h-4 mr-2" />
            Create New Story
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 