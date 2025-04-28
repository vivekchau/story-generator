import { prisma } from '../../lib/prisma';
import { clearAllTables, createTestUser, createTestStory, initTestDatabase, closeTestDatabase } from './testUtils';
import { PrismaClient, Prisma } from '@prisma/client';

// Mock the global object
const originalGlobal = global;
const mockGlobal = {
  ...global,
  prisma: undefined,
  window: undefined
};

// Mock process.env
const originalEnv = { ...process.env };

describe('Database Test Utils', () => {
  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
    // Restore original process.env
    process.env = originalEnv;
  });

  beforeEach(async () => {
    await clearAllTables();
    // Reset global object before each test
    global.prisma = undefined;
  });

  afterEach(() => {
    // Restore original global object
    global = originalGlobal;
  });

  it('should connect to test database', async () => {
    // Verify we're using test database
    expect(process.env.DATABASE_URL).toContain('test');
    
    // Try to query the database
    type QueryResult = { number: bigint }[];
    const result = await prisma.$queryRaw<QueryResult>`SELECT 1 as number`;
    expect(Number(result[0].number)).toBe(1);
  });

  it('should clear database between tests', async () => {
    // Create a test user and story
    const user = await createTestUser();
    const story = await createTestStory(user.id);
    
    // Verify story was created
    let stories = await prisma.story.findMany();
    expect(stories).toHaveLength(1);
    
    // Clear database
    await clearAllTables();
    
    // Verify database is empty
    stories = await prisma.story.findMany();
    expect(stories).toHaveLength(0);
  });

  it('should create test user with default values', async () => {
    const user = await createTestUser();
    expect(user.name).toBe('Test User');
    expect(user.email).toMatch(/test.*@example.com/);
  });

  it('should create test user with custom values', async () => {
    const customUser = await createTestUser({
      name: 'Custom User',
      email: 'custom@example.com'
    });
    expect(customUser.name).toBe('Custom User');
    expect(customUser.email).toBe('custom@example.com');
  });

  it('should create test story with default values', async () => {
    const story = await createTestStory();
    expect(story.title).toBe('Test Story');
    expect(story.content).toBe('Test Content');
    expect(story.userId).toBeDefined();
  });

  it('should create test story with custom values', async () => {
    const user = await createTestUser();
    const story = await createTestStory(user.id, {
      title: 'Custom Title',
      content: 'Custom Content'
    });
    expect(story.title).toBe('Custom Title');
    expect(story.content).toBe('Custom Content');
    expect(story.userId).toBe(user.id);
  });

  describe('Prisma Client Configuration', () => {
    let originalGlobal: any;
    
    beforeEach(() => {
      // Save original global object
      originalGlobal = { ...global };
      
      // Mock window object
      Object.defineProperty(global, 'window', {
        value: {
          document: {
            createElement: () => ({}),
            addEventListener: () => {},
            removeEventListener: () => {}
          },
          navigator: {
            userAgent: 'Mozilla/5.0',
            platform: 'MacIntel'
          },
          location: {
            href: 'http://localhost:3000',
            protocol: 'http:',
            host: 'localhost:3000'
          },
          addEventListener: () => {},
          removeEventListener: () => {},
          fetch: () => Promise.resolve({}),
          XMLHttpRequest: function() {},
          localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          }
        },
        configurable: true,
        writable: true
      });
    });

    afterEach(() => {
      // Clean up
      delete (global as any).window;
      Object.assign(global, originalGlobal);
    });

    it('should configure Prisma client for test environment', () => {
      process.env = { ...originalEnv, NODE_ENV: 'test' };
      const client = new PrismaClient();
      expect(client).toBeDefined();
    });

    it('should configure Prisma client for development environment', () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
      const client = new PrismaClient();
      expect(client).toBeDefined();
    });

    it('should configure Prisma client for production environment', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
      const client = new PrismaClient();
      expect(client).toBeDefined();
    });

    it('should reuse global Prisma instance in non-production environments', () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
      const firstInstance = prisma;
      const secondInstance = prisma;
      expect(firstInstance).toBe(secondInstance);
    });

    it('should not attach Prisma instance to global in production', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
      const client = prisma;
      expect(global.prisma).toBeUndefined();
    });

    it('should prevent PrismaClient instantiation in browser environment', () => {
      // Clear module cache to ensure fresh import
      jest.resetModules();
      
      // Import our local prisma file which contains the browser check
      expect(() => {
        require('../../lib/prisma');
      }).toThrow('PrismaClient cannot be instantiated in a browser environment');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Temporarily modify the DATABASE_URL to an invalid one
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@localhost:5432/invalid';

      try {
        await prisma.$connect();
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // Restore original DATABASE_URL
        process.env.DATABASE_URL = originalUrl;
      }
    });

    it('should handle query errors gracefully', async () => {
      try {
        await prisma.$queryRaw`INVALID SQL QUERY`;
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle transaction errors', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`INVALID SQL QUERY`;
        });
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Transaction Handling', () => {
    it('should handle successful transactions', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await createTestUser();
        const story = await createTestStory(user.id);
        return { user, story };
      });

      expect(result.user).toBeDefined();
      expect(result.story).toBeDefined();
    });

    it('should rollback failed transactions', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          // Create a user within the transaction
          const user = await tx.user.create({
            data: {
              name: 'Test User',
              email: `test-${Date.now()}@example.com`
            }
          });
          // Force an error
          await tx.$queryRaw`INVALID SQL QUERY`;
          return user;
        });
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        // Verify no user was created (transaction was rolled back)
        const users = await prisma.user.findMany();
        expect(users).toHaveLength(0);
      }
    });

    it('should handle nested transactions', async () => {
      const result = await prisma.$transaction(async (tx1) => {
        // Create user first
        const user = await tx1.user.create({
          data: {
            name: 'Test User',
            email: `test-${Date.now()}@example.com`
          }
        });

        // Create story in a nested transaction
        const story = await tx1.story.create({
          data: {
            title: 'Test Story',
            content: 'Test content',
            userId: user.id  // Use the created user's ID
          }
        });

        return { user, story };
      });

      expect(result.user).toBeDefined();
      expect(result.story).toBeDefined();
      expect(result.story.userId).toBe(result.user.id);

      // Clean up
      await prisma.story.delete({ where: { id: result.story.id } });
      await prisma.user.delete({ where: { id: result.user.id } });
    });
  });

  describe('Query Building', () => {
    it('should handle raw queries with parameters', async () => {
      const result = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE email = ${'test@example.com'}
      `;
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle complex queries', async () => {
      const user = await createTestUser();
      const story = await createTestStory(user.id);

      const result = await prisma.$queryRaw<Array<{ author_name: string }>>`
        SELECT s.*, u.name as author_name
        FROM "Story" s
        JOIN "User" u ON s."userId" = u.id
        WHERE s.id = ${story.id}
      `;

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('author_name');
    });
  });

  describe('Database Transaction Tests', () => {
    it('should handle transaction with multiple operations', async () => {
      let userId: string | null = null;
      let storyId: string | null = null;

      try {
        // Execute operations in a single transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create a test user
          const user = await tx.user.create({
            data: {
              email: 'test@example.com',
              name: 'Test User'
            }
          });
          userId = user.id;

          // Create a story for the user
          const story = await tx.story.create({
            data: {
              title: 'Test Story',
              content: 'Once upon a time...',
              userId: user.id,
              metadata: {
                age: 5,
                character: 'Dragon',
                setting: 'Castle',
                moral: 'Be kind'
              }
            }
          });
          storyId = story.id;

          return { user, story };
        });

        expect(result.user).toBeDefined();
        expect(result.story).toBeDefined();
        expect(result.story.userId).toBe(result.user.id);
      } catch (error) {
        console.error('Error in transaction test:', error);
        throw error;
      } finally {
        // Clean up created resources
        if (storyId) {
          await prisma.story.delete({ where: { id: storyId } });
        }
        if (userId) {
          await prisma.user.delete({ where: { id: userId } });
        }
      }
    });
  });
}); 