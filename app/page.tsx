"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MoonStar, Sparkles, Stars, Wand2, BookOpen, Palette } from "lucide-react"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8 mx-auto">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center mb-16 text-center">
        <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-primary/10">
          <MoonStar className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
          Bedtime Story Generator
        </h1>
        <p className="max-w-[42rem] mt-6 text-xl text-muted-foreground">
          Create magical, personalized bedtime stories for your little ones with AI-powered storytelling and beautiful illustrations.
        </p>
      </header>

      {/* Features Section */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 mb-16 md:grid-cols-3">
        <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/50">
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Personalized Stories</h3>
          <p className="text-sm text-muted-foreground">
            Customize characters, settings, and moral lessons to create unique stories that resonate with your child.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/50">
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Beautiful Illustrations</h3>
          <p className="text-sm text-muted-foreground">
            Each story comes with AI-generated illustrations that bring your tale to life with vibrant, child-friendly artwork.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/50">
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10">
            <Stars className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Instant Creation</h3>
          <p className="text-sm text-muted-foreground">
            Generate complete stories in seconds and download them as beautifully formatted PDFs for bedtime reading.
          </p>
        </div>
      </div>

      {/* Create Story Card */}
      <div className="w-full max-w-lg mx-auto">
        <Card className="flex flex-col h-full transition-all hover:shadow-lg border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
              Start Your Story
            </CardTitle>
            <CardDescription className="text-lg">
              Create a magical bedtime story in just a few clicks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Your story can include:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Custom characters and their personalities</li>
                <li>Magical settings and adventures</li>
                <li>Age-appropriate themes and morals</li>
                <li>Beautiful, matching illustrations</li>
                <li>Downloadable PDF format</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/create" className="w-full">
              <Button className="w-full" size="lg">
                <Wand2 className="w-5 h-5 mr-2" />
                Create Your Story
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>Create unforgettable bedtime moments with AI-powered storytelling</p>
      </footer>
    </div>
  )
}

