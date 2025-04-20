import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MoonStar, Sparkles, BookOpen } from "lucide-react"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8 mx-auto">
      <header className="flex flex-col items-center justify-center mb-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
          <MoonStar className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Bedtime Story Generator</h1>
        <p className="max-w-[42rem] mt-4 text-lg text-muted-foreground">
          Create magical, personalized bedtime stories for your little ones with just a few clicks.
        </p>
      </header>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        <Card className="flex flex-col h-full transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create New Story
            </CardTitle>
            <CardDescription>
              Generate a brand new bedtime story with characters and settings of your choice.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Choose your child&apos;s age, characters, setting, moral lesson, and story length to create a personalized
              bedtime adventure with beautiful illustrations.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/create" className="w-full">
              <Button className="w-full" size="lg">
                Start Creating
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col h-full transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Continue a Story
            </CardTitle>
            <CardDescription>Pick up where you left off with a previously saved story.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Select a story you&apos;ve saved before and continue the adventure with new twists and turns while
              maintaining the same beloved characters.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/continue" className="w-full">
              <Button className="w-full" variant="outline" size="lg">
                Continue Story
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

