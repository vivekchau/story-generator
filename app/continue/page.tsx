"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, BookOpen, Wand2 } from "lucide-react"
import { generateContinuation } from "@/lib/story-generator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoCircle } from "@/components/info-circle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Story } from "@/types/story"

export default function ContinueStory() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedStories, setSavedStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    storyId: "",
    recap: "",
    newCharacters: "",
    newSetting: "",
    newMoral: "",
  })

  useEffect(() => {
    // Load saved stories from localStorage
    const loadSavedStories = () => {
      try {
        // Get all keys from localStorage
        const keys = Object.keys(localStorage)
        
        // Filter for story keys and parse them
        const stories = keys
          .filter(key => key.startsWith('story_'))
          .map(key => {
            try {
              return JSON.parse(localStorage.getItem(key) || '{}') as Story
            } catch (e) {
              console.error(`Error parsing story from localStorage: ${key}`, e)
              return null
            }
          })
          .filter((story): story is Story => story !== null && 'id' in story)
        
        setSavedStories(stories)
      } catch (error) {
        console.error("Error loading saved stories:", error)
      }
    }

    loadSavedStories()
  }, [])

  const handleStorySelect = (storyId: string) => {
    setSelectedStory(storyId)
    setFormData((prev) => ({ ...prev, storyId }))
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStory) return

    setIsGenerating(true)

    try {
      // Find the selected story from savedStories
      const selectedStoryData = savedStories.find(story => story.id === selectedStory)
      if (!selectedStoryData) {
        throw new Error("Selected story not found")
      }

      // Automatically generate a recap from the previous story
      const previousContent = selectedStoryData.content
      const recap = previousContent.length > 200 
        ? previousContent.slice(0, 200) + "..."
        : previousContent

      // In a real app, we would call the API here
      const storyData = await generateContinuation({
        story: selectedStoryData,
        prompt: recap,
        // Include optional parameters if provided
        newCharacters: formData.newCharacters || undefined,
        newSetting: formData.newSetting || undefined,
        newMoral: formData.newMoral || undefined
      })

      // Save the story data to localStorage for the story page to access
      localStorage.setItem("currentStory", JSON.stringify(storyData))

      // Navigate to the story page
      router.push("/story")
    } catch (error) {
      console.error("Error generating story continuation:", error)
      setIsGenerating(false)
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8 mx-auto">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold">Continue a Story</CardTitle>
            <div className="w-8"></div> {/* Spacer for alignment */}
          </div>
          <CardDescription>Select a previously saved story to continue the adventure</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {savedStories.length === 0 ? (
            <Alert>
              <BookOpen className="w-4 h-4" />
              <AlertTitle>No saved stories found</AlertTitle>
              <AlertDescription>You haven&apos;t saved any stories yet. Create a new story first!</AlertDescription>
              <div className="mt-4">
                <Link href="/create">
                  <Button>Create New Story</Button>
                </Link>
              </div>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select a Story to Continue</Label>
                  <ScrollArea className="h-48 border rounded-md">
                    <div className="p-4 space-y-2">
                      {savedStories.map((story) => (
                        <div
                          key={story.id}
                          className={`p-3 rounded-md cursor-pointer transition-colors ${
                            selectedStory === story.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                          onClick={() => handleStorySelect(story.id)}
                        >
                          <div className="font-medium">{story.title || "Untitled Story"}</div>
                          <div className="text-xs opacity-80">{new Date(story.createdAt).toLocaleDateString()}</div>
                          <div className="mt-1 text-sm line-clamp-2">{story.content.substring(0, 100)}...</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {selectedStory && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="newCharacters">New Characters (Optional)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircle />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Add new characters to the story</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="newCharacters"
                        placeholder="e.g., a wise owl, a mischievous fox"
                        value={formData.newCharacters}
                        onChange={(e) => handleChange("newCharacters", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="newSetting">New Setting (Optional)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircle />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Change or add to the story setting</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="newSetting"
                        placeholder="e.g., a hidden waterfall, a mountain peak"
                        value={formData.newSetting}
                        onChange={(e) => handleChange("newSetting", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="newMoral">New Moral (Optional)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircle />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Add a new moral or lesson to focus on</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="newMoral"
                        placeholder="e.g., patience, honesty"
                        value={formData.newMoral}
                        onChange={(e) => handleChange("newMoral", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {selectedStory && (
                <CardFooter className="px-0 pt-6">
                  <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
                    {isGenerating ? (
                      <>Generating Continuation...</>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Continue Story
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

