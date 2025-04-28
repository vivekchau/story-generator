import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Create a separate instance for testing
const prisma = new PrismaClient();

/**
 * Clears all tables in the test database
 */
export async function clearAllTables() {
  try {
    // Delete in correct order to handle foreign key constraints
    await prisma.story.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Error clearing tables:', error);
    throw error;
  }
}

/**
 * Creates a test user with optional custom data
 */
export async function createTestUser(customData = {}) {
  const timestamp = Date.now();
  const defaultData = {
    email: `test-${timestamp}@example.com`,
    name: 'Test User',
    id: uuidv4()
  };

  return await prisma.user.create({
    data: {
      ...defaultData,
      ...customData
    }
  });
}

/**
 * Creates a test story with optional custom data
 */
export async function createTestStory(userId?: string, customData: any = {}) {
  try {
    let user;
    
    // If no userId provided, create a new test user
    if (!userId) {
      user = await createTestUser();
    } else {
      // Find user with provided ID
      user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
    }
    
    // Extract any userId from customData to prevent overriding
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: ignoredUserId, ...safeCustomData } = customData;
    
    // Default story data
    const defaultData = {
      title: 'Test Story',
      content: 'Test Content',
      images: [],
      metadata: {}
    };
    
    // Create story with merged data
    return await prisma.story.create({
      data: {
        ...defaultData,
        ...safeCustomData,
        userId: user.id // Always use the found/created user's id
      }
    });
  } catch (error) {
    console.error('Error creating test story:', error);
    throw error;
  }
}

/**
 * Initializes the test database connection
 */
export async function initTestDatabase() {
  try {
    // Set test database URL if not set
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test_db';
    }
    
    // Force test database in URL
    if (!process.env.DATABASE_URL.includes('test')) {
      const url = new URL(process.env.DATABASE_URL);
      url.pathname = '/test_db';
      process.env.DATABASE_URL = url.toString();
    }

    // Test the connection
    await prisma.$connect();
    
    // Clear all data before starting
    await clearAllTables();
    
    return prisma;
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

/**
 * Closes the test database connection
 */
export async function closeTestDatabase() {
  await prisma.$disconnect();
} 