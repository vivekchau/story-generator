"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Wand2 } from "lucide-react"
import { generateStory } from "@/lib/story-generator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoCircle } from "@/components/info-circle"

export default function CreateStory() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    age: "",
    characters: "",
    setting: "",
    moral: "",
    length: "medium",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      // In a real app, we would call the API here
      const storyData = await generateStory({
        age: formData.age,
        characters: formData.characters,
        setting: formData.setting,
        moral: formData.moral,
        length: formData.length as "short" | "medium" | "long"
      })

      // Add metadata to the story data
      const storyWithMetadata = {
        ...storyData,
        metadata: {
          characters: formData.characters,
          setting: formData.setting,
          moral: formData.moral,
          length: formData.length as "short" | "medium" | "long"
        }
      }

      // Save the story data to localStorage for the story page to access
      localStorage.setItem("currentStory", JSON.stringify(storyWithMetadata))
      
      // Also save it with its ID for the polling mechanism
      localStorage.setItem(`story_${storyData.id}`, JSON.stringify(storyWithMetadata))

      // Navigate to the story page
      router.push("/story")
    } catch (error) {
      console.error("Error generating story:", error)
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
            <CardTitle className="text-2xl font-bold">Create a New Story</CardTitle>
            <div className="w-8"></div> {/* Spacer for alignment */}
          </div>
          <CardDescription>Fill in the details below to create a personalized bedtime story</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="age">Child&apos;s Age</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">We&apos;ll adjust the story complexity based on your child&apos;s age</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={formData.age} onValueChange={(value) => handleChange("age", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-4">2-4 years</SelectItem>
                  <SelectItem value="4-8">4-8 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="characters">Characters</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Who are the main characters in the story? (e.g., "a brave unicorn", "a curious robot")
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="characters"
                placeholder="e.g., a brave unicorn, a curious robot"
                value={formData.characters}
                onChange={(e) => handleChange("characters", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="setting">Setting</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Where does the story take place? (e.g., "a magical forest", "a space station")
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="setting"
                placeholder="e.g., a magical forest, a space station"
                value={formData.setting}
                onChange={(e) => handleChange("setting", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="moral">Moral or Learning</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        What value or lesson should the story teach? (e.g., "kindness", "perseverance")
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="moral"
                placeholder="e.g., kindness, perseverance, teamwork"
                value={formData.moral}
                onChange={(e) => handleChange("moral", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Story Length</Label>
              <Select value={formData.length} onValueChange={(value) => handleChange("length", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~150 words, 1-2 images)</SelectItem>
                  <SelectItem value="medium">Medium (~300 words, 3-4 images)</SelectItem>
                  <SelectItem value="long">Long (~500 words, 5-6 images)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
              {isGenerating ? (
                <>Generating Story...</>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Story
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

