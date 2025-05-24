import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { authOptions } from "../auth/[...nextauth]/route"
import { Prisma } from "@prisma/client"
import { createClient } from '@supabase/supabase-js'

console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Define the expected types
interface StoryMetadata {
  [key: string]: string | undefined;  // Add index signature
  characters?: string;
  setting?: string;
  moral?: string;
  length?: string;
  age?: string;
  tone?: string;
}

interface StoryData {
  title: string;
  content: string;
  metadata?: StoryMetadata;
  images?: string[];
}

// Validation functions
export function validateStoryData(data: any): { isValid: boolean; error?: string } {
  if (!data.title || typeof data.title !== 'string') {
    return { isValid: false, error: 'Title is required and must be a string' };
  }

  if (!data.content || typeof data.content !== 'string') {
    return { isValid: false, error: 'Content is required and must be a string' };
  }

  if (data.images && !Array.isArray(data.images)) {
    return { isValid: false, error: 'Images must be an array of strings' };
  }

  if (data.metadata && typeof data.metadata !== 'object') {
    return { isValid: false, error: 'Metadata must be an object' };
  }

  return { isValid: true };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session)

    if (!session || !session.user) {
      console.log('No session found:', { session })
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      )
    }

    const data = await req.json()
    console.log('Received data:', data)

    // Validate the data
    const validation = validateStoryData(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Clean the data before saving
    const cleanData: StoryData = {
      title: data.title.trim(),
      content: data.content.trim(),
      images: Array.isArray(data.images) ? data.images.filter((url: string) => typeof url === 'string') : [],
      metadata: data.metadata || {}
    }

    // Upload images to Supabase Storage and get permanent URLs
    const permanentImageUrls: string[] = []
    for (let i = 0; i < cleanData.images.length; i++) {
      const tempUrl = cleanData.images[i]
      try {
        // Download image as buffer
        const response = await fetch(tempUrl)
        if (!response.ok) throw new Error('Failed to download image from temp URL')
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        // Upload to Supabase Storage
        const filePath = `${session.user.id}/${Date.now()}-image-${i}.png`
        const { error: uploadError } = await supabase.storage
          .from('story-images')
          .upload(filePath, buffer, { contentType: 'image/png', upsert: true })
        if (uploadError) throw uploadError
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('story-images')
          .getPublicUrl(filePath)
        permanentImageUrls.push(publicUrlData.publicUrl)
      } catch (err) {
        console.error('Image upload error:', err)
        // Optionally, skip or add a placeholder
      }
    }

    const story = await prisma.story.create({
      data: {
        title: cleanData.title,
        content: cleanData.content,
        images: permanentImageUrls,
        metadata: cleanData.metadata,
        userId: session.user.id
      }
    })

    console.log('Story saved successfully:', story.id)

    return NextResponse.json(story)
  } catch (error) {
    console.error('Story save error:', error)
    return NextResponse.json(
      { error: "Failed to save story", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('GET /api/stories session:', session);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const stories = await prisma.story.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(stories);

  } catch (error) {
    console.error('Error in GET /api/stories:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
} 