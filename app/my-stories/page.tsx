"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Story {
  id: string
  title: string
  content: string
  createdAt: string
}

export default function MyStories() {
  const { data: session, status } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  async function fetchStories() {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch("/api/stories")
      console.log("Response status:", response.status)
      
      const data = await response.json()
      console.log("Response data:", data)
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      setStories(data)
    } catch (err) {
      console.error("Error fetching stories:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch stories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchStories()
    }
  }, [session])

  if (status === "loading" || loading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!session) {
    return <div className="p-4">Please sign in to view your stories</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Stories</h1>
      {stories.length === 0 ? (
        <p>No stories found</p>
      ) : (
        <ul className="space-y-4">
          {stories.map((story) => (
            <li key={story.id} className="border p-4 rounded-lg">
              <Link href={`/story/${story.id}`}>
                <h2 className="text-xl font-semibold">{story.title}</h2>
              </Link>
              <p className="text-sm text-gray-500">
                Created: {new Date(story.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 