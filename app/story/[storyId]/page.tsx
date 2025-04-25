'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { use } from 'react';

interface Story {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  images?: string[];
}

export default function StoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = use(params);
  const { data: session, status } = useSession();
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/stories/${storyId}`);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Story data:', data);
        
        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch story: ${response.status}`);
        }
        
        setStory(data);
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch story');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchStory();
    }
  }, [storyId, session]);

  if (status === 'loading' || loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!session) {
    return <div className="p-4">Please sign in to view this story</div>;
  }

  if (!story) {
    return <div className="p-4">Story not found</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{story.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        Created: {new Date(story.createdAt).toLocaleDateString()}
      </p>
      <div className="whitespace-pre-wrap">{story.content}</div>
      {story.images && story.images.length > 0 && (
        <div className="mt-4">
          {story.images.map((image, index) => (
            <img 
              key={index}
              src={image}
              alt={`Story image ${index + 1}`}
              className="max-w-full h-auto mb-4"
            />
          ))}
        </div>
      )}
    </div>
  );
} 