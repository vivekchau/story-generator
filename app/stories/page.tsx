"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { BookOpen, Download } from "lucide-react"
import { DownloadButton } from "@/components/download-button"
import jsPDF from "jspdf"

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

  const downloadPDF = async (story: Story) => {
    try {
      const doc = new jsPDF()
      let y = 20
      const lineHeight = 7
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const maxWidth = doc.internal.pageSize.width - 2 * margin

      // Add title
      doc.setFontSize(20)
      doc.text(story.title, margin, y)
      y += lineHeight * 2

      // Add story content with inline images
      doc.setFontSize(12)
      const paragraphs = story.content.split('\n\n')
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i]
        const lines = doc.splitTextToSize(paragraph, maxWidth)
        for (const line of lines) {
          if (y > pageHeight - margin) {
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += lineHeight
        }
        y += lineHeight
        // Add image after every 1-2 paragraphs
        if (story.images && story.images[Math.floor(i / 2)] && i % 2 === 1) {
          const imageIndex = Math.floor(i / 2)
          const imageUrl = story.images[imageIndex]
          try {
            const response = await fetch('/api/proxy-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: imageUrl }),
            })
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
            const imageBlob = await response.blob()
            const imageData = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.readAsDataURL(imageBlob)
            })
            if (y > pageHeight - margin - 100) {
              doc.addPage()
              y = margin
            }
            const imgWidth = maxWidth
            const imgHeight = (imgWidth * 9) / 16
            doc.addImage(imageData as string, 'JPEG', margin, y, imgWidth, imgHeight)
            y += imgHeight + lineHeight * 2
          } catch (error) {
            console.error('Error adding image to PDF:', error)
          }
        }
      }
      doc.save(`${story.title}.pdf`)
      toast({ title: 'Success', description: 'Story downloaded successfully!' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({ title: 'Error', description: 'Failed to download story. Please try again.', variant: 'destructive' })
    }
  }

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
                <div className="flex gap-2">
                  <Button className="w-full" onClick={() => router.push(`/story/${story.id}`)}>
                    Read Story
                  </Button>
                  <DownloadButton onDownload={() => downloadPDF(story)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 