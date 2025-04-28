// Mock all dependencies before importing anything
jest.mock('../../lib/prisma', () => {
  const mockPrisma = {
    story: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  };
  // Set default mock implementation
  mockPrisma.story.findMany.mockResolvedValue([]);
  return { prisma: mockPrisma };
});

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Update NextResponse mock to properly handle JSON
jest.mock('next/server', () => {
  const actualNextServer = jest.requireActual('next/server');
  return {
    ...actualNextServer,
    NextResponse: {
      json: (data: any, init?: ResponseInit) => {
        const response = new Response(JSON.stringify(data), init);
        Object.defineProperty(response, 'json', {
          value: async () => data
        });
        return response;
      }
    }
  };
});

// Mock the auth options
jest.mock('../../app/api/auth/[...nextauth]/route', () => ({
  authOptions: {
    adapter: {
      createUser: jest.fn(),
      getUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByAccount: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      linkAccount: jest.fn(),
      unlinkAccount: jest.fn(),
      createSession: jest.fn(),
      getSessionAndUser: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      createVerificationToken: jest.fn(),
      useVerificationToken: jest.fn(),
    },
    providers: [
      {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
        token: 'https://oauth2.googleapis.com/token',
        userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
        profile: (profile: any) => ({
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        })
      }
    ],
    session: { strategy: 'jwt' },
    secret: 'test-secret'
  }
}));

// Now import the functions we want to test
const { validateStoryData, POST, GET } = require('../../app/api/stories/route');
const { prisma } = require('../../lib/prisma');
const { getServerSession } = require('next-auth/next');
import { NextResponse } from 'next/server';
import { clearAllTables, createTestUser, createTestStory, initTestDatabase, closeTestDatabase } from '../utils/testUtils';

describe('Stories API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  };

  const mockStory = {
    title: 'Test Story',
    content: 'Once upon a time...',
    images: ['image1.jpg'],
    metadata: {
      age: '5-8',
      tone: 'happy'
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    getServerSession.mockResolvedValue(mockSession);
  });

  describe('Story Validation', () => {
    it('should validate correct story data', () => {
      const result = validateStoryData(mockStory);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject story without title', () => {
      const storyWithoutTitle = {
        content: 'Once upon a time...'
      };

      const result = validateStoryData(storyWithoutTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required and must be a string');
    });

    it('should reject story without content', () => {
      const storyWithoutContent = {
        title: 'My Story'
      };

      const result = validateStoryData(storyWithoutContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content is required and must be a string');
    });

    it('should reject non-string title', () => {
      const storyWithInvalidTitle = {
        title: 123,
        content: 'Once upon a time...'
      };

      const result = validateStoryData(storyWithInvalidTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required and must be a string');
    });

    it('should reject non-string content', () => {
      const storyWithInvalidContent = {
        title: 'My Story',
        content: ['not a string']
      };

      const result = validateStoryData(storyWithInvalidContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content is required and must be a string');
    });

    it('should reject non-array images', () => {
      const storyWithInvalidImages = {
        title: 'My Story',
        content: 'Once upon a time...',
        images: 'not-an-array'
      };

      const result = validateStoryData(storyWithInvalidImages);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Images must be an array of strings');
    });

    it('should reject non-object metadata', () => {
      const storyWithInvalidMetadata = {
        title: 'My Story',
        content: 'Once upon a time...',
        metadata: 'not-an-object'
      };

      const result = validateStoryData(storyWithInvalidMetadata);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Metadata must be an object');
    });
  });

  describe('POST /api/stories', () => {
    it('should create a new story successfully', async () => {
      const mockRequest = {
        json: () => Promise.resolve(mockStory)
      };

      prisma.story.create.mockResolvedValue({
        id: 'test-story-id',
        ...mockStory,
        userId: mockSession.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.story.create).toHaveBeenCalledWith({
        data: {
          ...mockStory,
          userId: mockSession.user.id
        }
      });
      expect(data).toHaveProperty('id', 'test-story-id');
    });

    it('should return 401 when not authenticated', async () => {
      const mockRequest = {
        json: () => Promise.resolve(mockStory)
      };

      getServerSession.mockResolvedValueOnce(null);

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toEqual({ error: 'Not authenticated' });
    });

    it('should return 400 for invalid story data', async () => {
      const invalidStory = {
        title: '',
        content: ''
      };

      const mockRequest = {
        json: () => Promise.resolve(invalidStory)
      };

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });

    it('should create a story with minimum required fields', async () => {
      const minimalStory = {
        title: 'Minimal Story',
        content: 'Just the basics'
      };

      const mockRequest = {
        json: () => Promise.resolve(minimalStory)
      };

      prisma.story.create.mockResolvedValue({
        id: 'minimal-story-id',
        ...minimalStory,
        userId: mockSession.user.id,
        images: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.story.create).toHaveBeenCalledWith({
        data: {
          ...minimalStory,
          userId: mockSession.user.id,
          images: [],
          metadata: {}
        }
      });
      expect(data).toHaveProperty('id', 'minimal-story-id');
    });

    it('should handle empty arrays and objects properly', async () => {
      const storyWithEmptyFields = {
        title: 'Empty Fields Story',
        content: 'Testing empty fields',
        images: [],
        metadata: {}
      };

      const mockRequest = {
        json: () => Promise.resolve(storyWithEmptyFields)
      };

      prisma.story.create.mockResolvedValue({
        id: 'empty-fields-story-id',
        ...storyWithEmptyFields,
        userId: mockSession.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.story.create).toHaveBeenCalledWith({
        data: {
          ...storyWithEmptyFields,
          userId: mockSession.user.id
        }
      });
      expect(data).toHaveProperty('id', 'empty-fields-story-id');
    });

    it('should handle complex metadata', async () => {
      const storyWithComplexMetadata = {
        title: 'Complex Metadata Story',
        content: 'Testing complex metadata',
        metadata: {
          age: '5-8',
          tone: 'happy',
          characters: 'dragon, princess',
          setting: 'magical forest',
          moral: 'be kind to others',
          length: 'medium'
        }
      };

      const mockRequest = {
        json: () => Promise.resolve(storyWithComplexMetadata)
      };

      prisma.story.create.mockResolvedValue({
        id: 'complex-metadata-story-id',
        ...storyWithComplexMetadata,
        userId: mockSession.user.id,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.story.create).toHaveBeenCalledWith({
        data: {
          ...storyWithComplexMetadata,
          userId: mockSession.user.id,
          images: []
        }
      });
      expect(data).toHaveProperty('id', 'complex-metadata-story-id');
      expect(data.metadata).toEqual(storyWithComplexMetadata.metadata);
    });

    it('should handle database errors gracefully', async () => {
      const mockRequest = {
        json: () => Promise.resolve(mockStory)
      };

      const dbError = new Error('Database connection failed');
      prisma.story.create.mockRejectedValue(dbError);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to save story',
        details: 'Database connection failed'
      });
    });

    it('should trim whitespace from title and content', async () => {
      const storyWithWhitespace = {
        title: '  Whitespace Story  ',
        content: '  Content with spaces  '
      };

      const mockRequest = {
        json: () => Promise.resolve(storyWithWhitespace)
      };

      const trimmedStory = {
        title: 'Whitespace Story',
        content: 'Content with spaces'
      };

      prisma.story.create.mockResolvedValue({
        id: 'whitespace-story-id',
        ...trimmedStory,
        userId: mockSession.user.id,
        images: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.story.create).toHaveBeenCalledWith({
        data: {
          ...trimmedStory,
          userId: mockSession.user.id,
          images: [],
          metadata: {}
        }
      });
      expect(data.title).toBe(trimmedStory.title);
      expect(data.content).toBe(trimmedStory.content);
    });
  });

  describe('GET /api/stories', () => {
    it('should return all stories for authenticated user', async () => {
      const mockStories = [
        {
          id: 'story-1',
          ...mockStory,
          userId: mockSession.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prisma.story.findMany.mockResolvedValue(mockStories);

      const mockRequest = {};
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: { userId: mockSession.user.id },
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
      expect(data).toEqual(mockStories);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValueOnce(null);

      const mockRequest = {};
      const response = await GET(mockRequest);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toEqual({ error: 'Not authenticated' });
    });
  });
});

describe('Story API Integration Tests', () => {
  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
    jest.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      (prisma.story.findMany as jest.Mock).mockResolvedValue([]);

      const getResponse = await GET(new Request('http://localhost/api/stories'));
      expect(getResponse.status).toBe(401);
      const getJson = await getResponse.json();
      expect(getJson.error).toBe('Not authenticated');

      const postResponse = await POST(new Request('http://localhost/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Story',
          content: 'Test content'
        })
      }));
      expect(postResponse.status).toBe(401);
      const postJson = await postResponse.json();
      expect(postJson.error).toBe('Not authenticated');
    });

    it('should return 401 when session exists but has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({});
      (prisma.story.findMany as jest.Mock).mockResolvedValue([]);

      const getResponse = await GET(new Request('http://localhost/api/stories'));
      expect(getResponse.status).toBe(401);
      const getJson = await getResponse.json();
      expect(getJson.error).toBe('Not authenticated');

      const postResponse = await POST(new Request('http://localhost/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Story',
          content: 'Test content'
        })
      }));
      expect(postResponse.status).toBe(401);
      const postJson = await postResponse.json();
      expect(postJson.error).toBe('Not authenticated');
    });

    it('should allow access with valid session', async () => {
      const testUser = await createTestUser();
      
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name
        }
      });

      (prisma.story.findMany as jest.Mock).mockResolvedValue([]);
      
      const getResponse = await GET(new Request('http://localhost/api/stories'));
      expect(getResponse.status).toBe(200);
      const getJson = await getResponse.json();
      expect(Array.isArray(getJson)).toBe(true);
      expect(getJson).toHaveLength(0);

      const createdStory = {
        id: 'new-story-id',
        title: 'Test Story',
        content: 'Test content',
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (prisma.story.create as jest.Mock).mockResolvedValue(createdStory);

      const postResponse = await POST(new Request('http://localhost/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Story',
          content: 'Test content'
        })
      }));
      expect(postResponse.status).toBe(200);
      const postJson = await postResponse.json();
      expect(postJson.title).toBe('Test Story');
      expect(postJson.content).toBe('Test content');
      expect(postJson.userId).toBe(testUser.id);
    });
  });

  describe('Story Retrieval', () => {
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    };

    const mockStories = [
      {
        id: 'story-1',
        title: 'First Story',
        content: 'Content 1',
        metadata: { age: '5-8', tone: 'happy' },
        images: [],
        userId: testUser.id,
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15')
      },
      {
        id: 'story-2',
        title: 'Second Story',
        content: 'Content 2',
        metadata: { age: '9-12', tone: 'adventure' },
        images: [],
        userId: testUser.id,
        createdAt: new Date('2024-03-16'),
        updatedAt: new Date('2024-03-16')
      }
    ];

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: testUser });
    });

    it('should return empty array when user has no stories', async () => {
      (prisma.story.findMany as jest.Mock).mockResolvedValue([]);

      const response = await GET(new Request('http://localhost/api/stories'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
      expect(prisma.story.findMany).toHaveBeenCalledWith({
        where: { userId: testUser.id },
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
    });

    it('should return all stories for the user sorted by creation date', async () => {
      (prisma.story.findMany as jest.Mock).mockResolvedValue(mockStories);

      const response = await GET(new Request('http://localhost/api/stories'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('story-1');
      expect(data[1].id).toBe('story-2');
      expect(new Date(data[0].createdAt)).toEqual(mockStories[0].createdAt);
      expect(new Date(data[1].createdAt)).toEqual(mockStories[1].createdAt);
    });

    it('should handle database query errors gracefully', async () => {
      const dbError = new Error('Database query failed');
      (prisma.story.findMany as jest.Mock).mockRejectedValue(dbError);

      const response = await GET(new Request('http://localhost/api/stories'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Internal server error',
        details: 'Database query failed'
      });
    });

    it('should return stories with complete metadata', async () => {
      const storyWithFullMetadata = {
        id: 'story-3',
        title: 'Full Metadata Story',
        content: 'Story content',
        metadata: {
          age: '5-8',
          tone: 'happy',
          characters: 'dragon, princess',
          setting: 'magical forest',
          moral: 'be kind to others',
          length: 'medium'
        },
        images: ['image1.jpg', 'image2.jpg'],
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.story.findMany as jest.Mock).mockResolvedValue([storyWithFullMetadata]);

      const response = await GET(new Request('http://localhost/api/stories'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].metadata).toEqual(storyWithFullMetadata.metadata);
      expect(data[0].images).toEqual(storyWithFullMetadata.images);
    });

    it('should handle malformed session data gracefully', async () => {
      // Test with invalid session structure
      (getServerSession as jest.Mock).mockResolvedValue({ 
        // Missing user object
      });

      const response = await GET(new Request('http://localhost/api/stories'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Not authenticated' });
      expect(prisma.story.findMany).not.toHaveBeenCalled();
    });

    it('should handle large result sets', async () => {
      // Create an array of 100 mock stories
      const largeStorySet = Array.from({ length: 100 }, (_, i) => ({
        id: `story-${i}`,
        title: `Story ${i}`,
        content: `Content ${i}`,
        metadata: { age: '5-8', tone: 'happy' },
        images: [],
        userId: testUser.id,
        createdAt: new Date(2024, 2, i + 1), // March 1-100, 2024
        updatedAt: new Date(2024, 2, i + 1)
      }));

      (prisma.story.findMany as jest.Mock).mockResolvedValue(largeStorySet);

      const response = await GET(new Request('http://localhost/api/stories'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(100);
      // Verify the stories are in the correct order
      expect(new Date(data[0].createdAt).getTime()).toBeLessThan(new Date(data[1].createdAt).getTime());
    });
  });
}); 