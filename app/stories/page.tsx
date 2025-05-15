"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"

interface Story {
  id: string
  title: string
  content: string
  createdAt: string
  images: string[]
}

export default function StoriesPage() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push("/")
      return
    }

    const fetchStories = async () => {
      try {
        const response = await fetch("/api/stories")
        if (!response.ok) throw new Error("Failed to fetch stories")
        const data = await response.json()
        setStories(data)
      } catch (error) {
        console.error("Error fetching stories:", error)
        toast({
          title: "Error",
          description: "Failed to load your stories. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [session, router, toast])

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">Loading your stories...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Stories</h1>
      {stories.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
          <p className="text-muted-foreground mb-4">Create your first story to see it here!</p>
          <Button onClick={() => router.push("/create")}>Create Story</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{story.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {new Date(story.createdAt).toLocaleDateString()}
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/story/${story.id}`)}
                >
                  Read Story
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 