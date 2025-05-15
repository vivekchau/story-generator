"use client"

import Link from "next/link"
import { Home, BookOpen, Wand2, LogOut, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { signOut, signIn, useSession } from "next-auth/react"

export function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          AIStory
        </Link>
        <div className="flex items-center gap-4">
          {pathname !== "/" && (
            <Link href="/">
              <Button 
                variant={pathname === "/" ? "default" : "ghost"} 
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          )}
          {session && (
            <Link href="/stories">
              <Button 
                variant={pathname === "/stories" ? "default" : "ghost"} 
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                My Stories
              </Button>
            </Link>
          )}
          <Link href="/create">
            <Button 
              variant={pathname === "/create" ? "default" : "ghost"} 
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Create Story
            </Button>
          </Link>
          {session ? (
            <Button variant="ghost" className="gap-2" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Button variant="ghost" className="gap-2" onClick={() => signIn("google")}> 
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
} 