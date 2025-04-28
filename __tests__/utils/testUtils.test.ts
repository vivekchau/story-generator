import { PrismaClient } from '@prisma/client';
import { 
  initTestDatabase, 
  closeTestDatabase, 
  clearAllTables, 
  createTestUser, 
  createTestStory 
} from './testUtils';

// Test cases for the utility functions
describe('Test Utilities', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  describe('createTestUser', () => {
    it('should create a user with default data', async () => {
      const user = await createTestUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name', 'Test User');
    });

    it('should create a user with custom data', async () => {
      const timestamp = Date.now();
      const customData = {
        name: 'Custom Name',
        email: `custom-${timestamp}@example.com`
      };
      const user = await createTestUser(customData);
      expect(user).toHaveProperty('name', 'Custom Name');
      expect(user).toHaveProperty('email', customData.email);
    });
  });

  describe('createTestStory', () => {
    it('should create a story with default data', async () => {
      const story = await createTestStory();
      expect(story).toHaveProperty('id');
      expect(story).toHaveProperty('title', 'Test Story');
      expect(story).toHaveProperty('content', 'Test Content');
      expect(story).toHaveProperty('userId');
    });

    it('should create a story with custom data', async () => {
      const user = await createTestUser();
      const customData = {
        title: 'Custom Title',
        content: 'Custom Content',
        metadata: { age: '5-8' }
      };
      const story = await createTestStory(user.id, customData);
      expect(story).toHaveProperty('title', 'Custom Title');
      expect(story).toHaveProperty('content', 'Custom Content');
      expect(story).toHaveProperty('metadata.age', '5-8');
      expect(story).toHaveProperty('userId', user.id);
    });

    it('should throw error for non-existent user', async () => {
      await expect(createTestStory('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('clearAllTables', () => {
    it('should clear all data from tables', async () => {
      // Create test data
      const user = await createTestUser();
      await createTestStory(user.id);

      // Clear tables
      await clearAllTables();

      // Verify tables are empty
      const users = await prisma.user.findMany();
      const stories = await prisma.story.findMany();
      expect(users).toHaveLength(0);
      expect(stories).toHaveLength(0);
    });
  });

  describe('Database Connection', () => {
    it('should connect to test database', async () => {
      const url = process.env.DATABASE_URL;
      expect(url).toContain('test');
      
      // Test connection
      await expect(prisma.$connect()).resolves.not.toThrow();
    });
  });
}); 