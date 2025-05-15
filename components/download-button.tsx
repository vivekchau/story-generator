"use client"

import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface DownloadButtonProps {
  onDownload: () => Promise<void>
  disabled?: boolean
  className?: string
}

export function DownloadButton({ onDownload, disabled, className }: DownloadButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!session) {
      // Store the current URL to redirect back after login
      const returnUrl = window.location.href
      localStorage.setItem('returnUrl', returnUrl)
      
      // Show a toast message
      toast({
        title: "Sign in required",
        description: "Please sign in to download stories.",
      })
      
      // Redirect to sign in
      signIn("google")
      return
    }

    try {
      setIsDownloading(true)
      await onDownload()
    } catch (error) {
      console.error('Error during download:', error)
      toast({
        title: "Error",
        description: "Failed to download. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      className={`${className} ${isDownloading ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <Download className="w-4 h-4" />
    </Button>
  )
} 