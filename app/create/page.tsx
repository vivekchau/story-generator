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
import { AlertCircle } from "@/components/alert-circle"

export default function CreateStory() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    age: "2-4", // Default age
    characters: "",
    setting: "",
    moral: "",
    length: "medium",
    tone: "warm, comforting",
  })
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.age) {
      errors.age = "Please select an age range"
    }
    
    if (formData.characters && formData.characters.length < 3) {
      errors.characters = "Character description is too short"
    }
    
    if (formData.setting && formData.setting.length < 3) {
      errors.setting = "Setting description is too short"
    }
    
    if (formData.moral && formData.moral.length < 3) {
      errors.moral = "Moral description is too short"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const getRandomCharacter = (age: string) => {
    const youngCharacters = [
      "a curious little mouse and a gentle elephant",
      "a playful puppy and a wise old cat",
      "a tiny fairy and a friendly dragon",
      "a brave teddy bear and a sleepy bunny",
      "a magical unicorn and a helpful squirrel",
      "twin butterfly sisters",
      "a baby penguin and their polar bear friend"
    ]

    const olderCharacters = [
      "a clever fox and a resourceful rabbit",
      "a young wizard and their phoenix companion",
      "a time-traveling explorer and their robot friend",
      "a determined young athlete and their mentor",
      "a creative artist and their imaginary friend",
      "siblings with special powers",
      "an inventor child and their latest creation"
    ]

    const characters = age === "2-4" ? youngCharacters : olderCharacters
    return characters[Math.floor(Math.random() * characters.length)]
  }

  const getRandomSetting = (age: string) => {
    const youngSettings = [
      "a magical treehouse that changes colors",
      "a garden where toys come to life at night",
      "a cloud castle made of cotton candy",
      "a cozy underwater bubble house",
      "a rainbow forest with singing flowers",
      "a playground that floats in the sky",
      "a candy village where everything is sweet"
    ]

    const olderSettings = [
      "a hidden valley where dragons nap",
      "a school for young magicians",
      "a space station orbiting a rainbow planet",
      "an ancient library with living books",
      "a city where animals and humans switched roles",
      "a mysterious island that appears once a year",
      "a laboratory where dreams are studied"
    ]

    const settings = age === "2-4" ? youngSettings : olderSettings
    return settings[Math.floor(Math.random() * settings.length)]
  }

  const getRandomMoral = (age: string) => {
    const youngMorals = [
      "sharing makes everyone happy",
      "being kind to others brings joy",
      "trying new things can be fun",
      "helping others makes us strong",
      "everyone is special in their own way",
      "patience leads to wonderful surprises",
      "family and friends make life magical"
    ]

    const olderMorals = [
      "courage means facing your fears",
      "creativity can solve any problem",
      "true friendship requires understanding",
      "learning from mistakes makes us wiser",
      "being different is a superpower",
      "perseverance leads to success",
      "kindness can change the world"
    ]

    const morals = age === "2-4" ? youngMorals : olderMorals
    return morals[Math.floor(Math.random() * morals.length)]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSuccess(false)

    if (!validateForm()) {
      return
    }

    setIsGenerating(true)

    try {
      // Generate random values for empty fields
      const characters = formData.characters || getRandomCharacter(formData.age)
      const setting = formData.setting || getRandomSetting(formData.age)
      const moral = formData.moral || getRandomMoral(formData.age)

      // Prepare data with randomly selected values for empty fields
      const storyData = await generateStory({
        age: formData.age,
        characters,
        setting,
        moral,
        length: formData.length as "short" | "medium" | "long",
        tone: formData.tone
      })

      // Add metadata to the story data
      const storyWithMetadata = {
        ...storyData,
        metadata: {
          characters,
          setting,
          moral,
          length: formData.length as "short" | "medium" | "long",
          age: formData.age,
          tone: formData.tone
        }
      }

      localStorage.setItem("currentStory", JSON.stringify(storyWithMetadata))
      localStorage.setItem(`story_${storyData.id}`, JSON.stringify(storyWithMetadata))
      setIsSuccess(true)
      router.push("/story")
    } catch (error) {
      console.error("Error generating story:", error)
      setError("An error occurred while generating the story. Please try again later.")
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
            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
                <AlertCircle className="inline-block w-4 h-4 mr-2" />
                {error}
              </div>
            )}
            {isSuccess && (
              <div className="p-4 text-sm text-green-500 bg-green-50 rounded-md">
                Story generated successfully! Redirecting...
              </div>
            )}
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
              <Select 
                value={formData.age} 
                onValueChange={(value) => handleChange("age", value)}
                data-testid="story-age"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-4">2-4 years</SelectItem>
                  <SelectItem value="4-8">4-8 years</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.age && (
                <p className="text-sm text-red-500">{validationErrors.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="characters">Characters (Optional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Who are the main characters? Leave empty for age-appropriate defaults
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="characters"
                data-testid="story-characters"
                placeholder={`e.g., ${getRandomCharacter(formData.age)}`}
                value={formData.characters}
                onChange={(e) => handleChange("characters", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="setting">Setting (Optional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Where does the story take place? Leave empty for age-appropriate defaults
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="setting"
                data-testid="story-setting"
                placeholder={`e.g., ${getRandomSetting(formData.age)}`}
                value={formData.setting}
                onChange={(e) => handleChange("setting", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="moral">Moral or Learning (Optional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        What lesson should the story teach? Leave empty for age-appropriate defaults
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="moral"
                data-testid="story-moral"
                placeholder={`e.g., ${getRandomMoral(formData.age)}`}
                value={formData.moral}
                onChange={(e) => handleChange("moral", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tone">Story Tone</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Choose the emotional tone of the story
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select 
                value={formData.tone} 
                onValueChange={(value) => handleChange("tone", value)}
                data-testid="story-tone"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm, comforting">Warm and Comforting</SelectItem>
                  <SelectItem value="adventurous">Adventurous</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="length">Story Length</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose how long you want the story to be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select 
                value={formData.length} 
                onValueChange={(value) => handleChange("length", value)}
                data-testid="story-length"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (2-3 minutes)</SelectItem>
                  <SelectItem value="medium">Medium (4-5 minutes)</SelectItem>
                  <SelectItem value="long">Long (6-7 minutes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
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

