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
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({})
  const [loadedImages, setLoadedImages] = useState<Record<number, string>>({})
  const [imageStatus, setImageStatus] = useState<"generating" | "complete" | "error">("generating")
  const [remainingImageCount, setRemainingImageCount] = useState(0)
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

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
    localStorage.setItem("currentStory", JSON.stringify(initialStory))
    localStorage.setItem(`story_${storyId}`, JSON.stringify(initialStory))

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
      
      const imagePrompt = `Create a child-friendly illustration without any text or words. Scene description: A gentle, colorful illustration for a children's bedtime story featuring ${story.metadata?.characters} in ${story.metadata?.setting}. The scene shows: "${paragraph.substring(0, 100)}...". Style: Soft, dreamy, and whimsical artwork suitable for children aged ${story.metadata?.age}. The illustration should convey ${story.metadata?.moral} through visual storytelling only. Use warm, soothing colors and avoid any text, letters, or numbers in the image. Make sure to maintain visual consistency with previous illustrations.`
      
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

  const downloadPDF = async () => {
    try {
      setIsDownloading(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15; // Increased margin for better readability
      const textWidth = pageWidth - (2 * margin);
      
      // Add title page
      doc.setFontSize(28);
      doc.text('My Bedtime Story', pageWidth / 2, pageHeight / 3, { align: 'center' });
      
      // Add metadata if available
      if (story?.metadata) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100); // Gray color for metadata
        let metadataY = pageHeight / 2;
        if (story.metadata.age) {
          doc.text(`For ages ${story.metadata.age}`, pageWidth / 2, metadataY, { align: 'center' });
          metadataY += 10;
        }
        if (story.metadata.characters) {
          doc.text(`Featuring ${story.metadata.characters}`, pageWidth / 2, metadataY, { align: 'center' });
        }
      }
      
      // Add a new page for the story content
      doc.addPage();
      let currentY = margin + 10;
      
      // Reset text color to black for story content
      doc.setTextColor(0, 0, 0);
      
      // Function to add text with word wrap and proper line spacing
      const addWrappedText = (text: string, y: number) => {
        const lines = doc.splitTextToSize(text, textWidth);
        doc.text(lines, margin, y);
        return y + (lines.length * 7); // Reduced line spacing
      };
      
      // Add each paragraph and image
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        
        // Add text
        doc.setFontSize(12);
        currentY = addWrappedText(paragraph, currentY);
        
        // Add image if available (only after every second paragraph)
        if (story && story.images[Math.floor(i/2)] && i % 2 === 1) {
          try {
            // Add some space before image
            currentY += 5;
            
            // Proxy the image through our API
            const response = await fetch('/api/proxy-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: story.images[Math.floor(i/2)] })
            });
            
            if (!response.ok) throw new Error('Failed to proxy image');
            
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Create a temporary image to get dimensions
            const img = document.createElement('img');
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = imageUrl;
            });
            
            // Calculate dimensions maintaining aspect ratio
            const maxImgWidth = pageWidth - (2 * margin);
            const maxImgHeight = 120; // Maximum height for images
            let imgWidth = maxImgWidth;
            let imgHeight = (img.height / img.width) * imgWidth;
            
            // If image is too tall, scale it down
            if (imgHeight > maxImgHeight) {
              imgHeight = maxImgHeight;
              imgWidth = (img.width / img.height) * imgHeight;
              // Center the image horizontally
              const xOffset = (pageWidth - imgWidth) / 2;
              currentY = Math.max(currentY, margin); // Ensure we're not too close to the top
              doc.addImage(imageUrl, 'JPEG', xOffset, currentY, imgWidth, imgHeight);
            } else {
              // Center the image horizontally
              const xOffset = (pageWidth - imgWidth) / 2;
              doc.addImage(imageUrl, 'JPEG', xOffset, currentY, imgWidth, imgHeight);
            }
            
            currentY += imgHeight + 10; // Space after image
            
            // Clean up the object URL
            URL.revokeObjectURL(imageUrl);
          } catch (error) {
            console.error('Failed to add image to PDF:', error);
            currentY = addWrappedText('(Image could not be loaded)', currentY + 5);
          }
        } else {
          // Add less space between paragraphs when there's no image
          currentY += 5;
        }
        
        // Check if we need a new page
        if (currentY > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
      }
      
      // Save the PDF with the story title
      const fileName = story?.title ? 
        `${story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf` : 
        'bedtime-story.pdf';
      doc.save(fileName);

      toast({
        title: "PDF Downloaded!",
        description: "Your story has been saved as a PDF with illustrations.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={downloadPDF}
                      disabled={isDownloading}
                      className={isDownloading ? "cursor-not-allowed opacity-50" : ""}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDownloading ? "Downloading PDF..." : "Download as PDF"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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