import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    // Wait for params to be available
    const storyId = await Promise.resolve(params.storyId);
    console.log('Fetching story with ID:', storyId);

    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify prisma connection
    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Prisma connection error:', error);
      return new Response(JSON.stringify({ error: "Database connection error" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const story = await prisma.story.findUnique({
      where: {
        id: storyId,
        userId: session.user.id
      }
    });

    if (!story) {
      return new Response(JSON.stringify({ error: "Story not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(story), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in GET /api/stories/[storyId]:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
} 