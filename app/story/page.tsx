"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Home, Save, Wand2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Story } from "@/types/story"

type StoryData = {
  id: string
  title: string
  content: string
  images: string[]
}

export default function StoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [story, setStory] = useState<StoryData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load the current story from localStorage
    const loadStory = () => {
      try {
        const storyJson = localStorage.getItem("currentStory")
        if (storyJson) {
          const storyData = JSON.parse(storyJson)
          setStory(storyData)
        } else {
          // No story found, redirect to home
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading story:", error)
        router.push("/")
      }
    }

    loadStory()
  }, [router])

  const saveStory = () => {
    if (!story) return

    setIsSaving(true)

    try {
      // Create a Story object with the required fields
      const storyToSave: Story = {
        id: story.id,
        title: story.title || "Untitled Story",
        content: story.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          // Add any metadata if available
        }
      }

      // Save the story with a unique key
      localStorage.setItem(`story_${story.id}`, JSON.stringify(storyToSave))

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
        <div className="text-center">Loading story...</div>
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
              {story.content.split("\n\n").map((paragraph, index) => {
                // Display an image after every 1-2 paragraphs, if available
                const shouldShowImage = story.images[Math.floor(index / 2)] && index % 2 === 1

                return (
                  <div key={index} className="space-y-6">
                    <p className="leading-7">{paragraph}</p>

                    {shouldShowImage && (
                      <div className="flex justify-center my-6">
                        <div className="relative overflow-hidden rounded-lg w-full max-w-md aspect-[4/3]">
                          <Image
                            src={story.images[Math.floor(index / 2)] || "/placeholder.svg"}
                            alt={`Illustration for ${story.title}`}
                            fill
                            className="object-cover"
                          />
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

