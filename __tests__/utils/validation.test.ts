// Mock all dependencies before importing anything
jest.mock('../../lib/prisma', () => ({
  prisma: {
    story: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

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

// Import after mocking
import { validateStoryData } from '../../app/api/stories/route';

describe('Story Validation', () => {
  const mockStory = {
    title: 'Test Story',
    content: 'Once upon a time...',
    images: ['image1.jpg'],
    metadata: {
      age: '5-8',
      tone: 'happy'
    }
  };

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
    } as any;

    const result = validateStoryData(storyWithInvalidTitle);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Title is required and must be a string');
  });

  it('should reject non-string content', () => {
    const storyWithInvalidContent = {
      title: 'My Story',
      content: ['not a string']
    } as any;

    const result = validateStoryData(storyWithInvalidContent);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Content is required and must be a string');
  });

  it('should reject non-array images', () => {
    const storyWithInvalidImages = {
      title: 'My Story',
      content: 'Once upon a time...',
      images: 'not-an-array'
    } as any;

    const result = validateStoryData(storyWithInvalidImages);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Images must be an array of strings');
  });

  it('should reject non-object metadata', () => {
    const storyWithInvalidMetadata = {
      title: 'My Story',
      content: 'Once upon a time...',
      metadata: 'not-an-object'
    } as any;

    const result = validateStoryData(storyWithInvalidMetadata);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Metadata must be an object');
  });
}); 