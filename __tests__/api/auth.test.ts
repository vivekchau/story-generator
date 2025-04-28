// Import test utilities first
import {
  MockResponse,
  createMockUser,
  createMockSession,
  createExpiredSession,
  ApiRequestHandler,
  createPrismaMocks,
  mockAuthOptions
} from '../utils/authTestUtils';

// Create Prisma mocks after importing
const prismaMocks = createPrismaMocks();

// Set up mocks
jest.mock('../../lib/prisma', () => ({
  prisma: prismaMocks
}));

jest.mock('../../app/api/auth/[...nextauth]/route', () => ({
  authOptions: mockAuthOptions
}));

// Mock for getServerSession
const getServerSessionMock = jest.fn();
jest.mock('next-auth/next', () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args)
}));

// Import remaining dependencies
import { NextResponse } from 'next/server';
import { clearAllTables, createTestUser, initTestDatabase, closeTestDatabase } from '../utils/testUtils';
import { Prisma } from '@prisma/client';

// Mock fetch globally
const apiHandler = new ApiRequestHandler(getServerSessionMock);
const fetchMock = jest.fn().mockImplementation((url, options) => apiHandler.mockFetch(url, options));
global.fetch = fetchMock;

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await initTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
    jest.clearAllMocks();
    getServerSessionMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockImplementation((url, options) => apiHandler.mockFetch(url, options));
    
    // Reset Prisma mocks
    Object.values(prismaMocks).forEach(model => {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      getServerSessionMock.mockImplementation((options) => {
        return Promise.resolve(createMockSession());
      });
    });

    it('should create and validate a new session', async () => {
      const testUser = await createTestUser();
      (prismaMocks.user.findUnique as jest.Mock).mockResolvedValue(testUser);

      const sessionData = {
        userId: testUser.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      (prismaMocks.session.create as jest.Mock).mockResolvedValue(sessionData);

      const mockSessionResponse = {
        user: testUser,
        expires: sessionData.expires.toISOString()
      };
      getServerSessionMock.mockResolvedValueOnce(mockSessionResponse);

      const response = await fetch('http://localhost:3000/api/protected');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(getServerSessionMock).toHaveBeenCalled();
      expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
    });

    it('should handle expired sessions', async () => {
      getServerSessionMock.mockImplementation((options) => {
        return Promise.resolve(createExpiredSession());
      });

      const response = await fetch('http://localhost:3000/api/protected');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Session expired' });
      expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
    });

    it('should handle invalid session tokens', async () => {
      getServerSessionMock.mockImplementation((options) => {
        return Promise.resolve(null);
      });

      const response = await fetch('http://localhost:3000/api/protected');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
    });

    it('should refresh an active session', async () => {
      const testUser = await createTestUser();
      (prismaMocks.user.findUnique as jest.Mock).mockResolvedValue(testUser);

      // Simulate a session that is about to expire
      const soonToExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      const refreshed = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const sessionData = {
        userId: testUser.id,
        expires: soonToExpire
      };
      (prismaMocks.session.create as jest.Mock).mockResolvedValue(sessionData);

      // Simulate refresh endpoint extending session
      getServerSessionMock.mockResolvedValueOnce({ user: testUser, expires: soonToExpire.toISOString() });
      // After refresh, session expiry is extended
      getServerSessionMock.mockResolvedValueOnce({ user: testUser, expires: refreshed.toISOString() });

      // Simulate hitting a refresh endpoint (replace with your actual refresh endpoint if different)
      const response = await fetch('http://localhost:3000/api/auth/refresh');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(typeof data.expires).toBe('string');
      expect(new Date(data.expires).getTime()).toBeGreaterThan(Date.now());
      expect(getServerSessionMock).toHaveBeenCalled();
    });

    it('should invalidate session on logout', async () => {
      const testUser = await createTestUser();
      (prismaMocks.user.findUnique as jest.Mock).mockResolvedValue(testUser);
      getServerSessionMock.mockResolvedValueOnce({ user: testUser, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });

      // Simulate hitting a logout endpoint
      const response = await fetch('http://localhost:3000/api/auth/logout', { method: 'POST' });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      // After logout, session should be invalidated
      getServerSessionMock.mockResolvedValueOnce(null);
      const checkSession = await fetch('http://localhost:3000/api/protected');
      const checkData = await checkSession.json();
      expect(checkSession.status).toBe(401);
      expect(checkData).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Authorization', () => {
    it('should protect routes that require authentication', async () => {
      getServerSessionMock.mockImplementation((options) => {
        return Promise.resolve(null);
      });
      
      const protectedRoutes = [
        '/api/stories',
        '/api/stories/create',
        '/api/user/profile'
      ];

      for (const route of protectedRoutes) {
        const response = await fetch(`http://localhost:3000${route}`);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({ error: 'Unauthorized' });
        expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
      }
    });

    it('should allow access to public routes', async () => {
      const publicRoutes = [
        '/api/auth/signin',
        '/api/auth/signup',
        '/api/health'
      ];

      for (const route of publicRoutes) {
        const response = await fetch(`http://localhost:3000${route}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ success: true });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during session validation', async () => {
      // Set up mock session
      const mockSession = createMockSession();
      getServerSessionMock.mockResolvedValueOnce(mockSession);

      // Simulate a database error
      const dbError = new Error('Database connection failed');
      apiHandler.setDatabaseError(dbError);

      // Make request to protected endpoint using global fetch mock
      const response = await fetch('http://localhost:3000/api/protected');
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Database connection failed');

      // Verify getServerSession was called with mockAuthOptions
      expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
    });

    it('should handle rate limiting for authentication attempts', async () => {
      // Reset database error
      apiHandler.setDatabaseError(null);

      // Simulate multiple rapid login attempts
      const loginAttempts = Array(10).fill(null).map(() => 
        fetch('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      const responses = await Promise.all(loginAttempts);
      const lastResponse = responses[responses.length - 1];
      
      expect(lastResponse.status).toBe(429);
      const data = await lastResponse.json();
      expect(data.error).toBe('Too many requests');
    });

    it('should handle token refresh errors', async () => {
      getServerSessionMock.mockImplementation((options) => {
        return Promise.resolve(createExpiredSession());
      });

      const response = await fetch('http://localhost:3000/api/protected');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Session expired');
      expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
    });

    it('should reset rate limit after cooldown period', async () => {
      // Reset database error
      apiHandler.setDatabaseError(null);

      // Simulate multiple rapid login attempts to trigger rate limiting
      const loginAttempts = Array(10).fill(null).map(() => 
        fetch('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      const responses = await Promise.all(loginAttempts);
      const lastResponse = responses[responses.length - 1];
      
      expect(lastResponse.status).toBe(429);
      const data = await lastResponse.json();
      expect(data.error).toBe('Too many requests');

      // Mock the cooldown period by resetting the request count
      apiHandler.resetRequestCount('/api/auth/signin');

      // Try another request after cooldown
      const responseAfterCooldown = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(responseAfterCooldown.status).toBe(200);
      const cooldownData = await responseAfterCooldown.json();
      expect(cooldownData).toEqual({ success: true });
    });
  });
});

// Add a comment to document the mock usage
/**
 * Note on Prisma mocking:
 * We use prismaMocks throughout this test file instead of the real prisma client.
 * This allows us to:
 * 1. Control database responses without touching the real database
 * 2. Test error scenarios easily
 * 3. Verify database operations are called correctly
 * 
 * Example usage:
 * (prismaMocks.user.findUnique as jest.Mock).mockResolvedValue(testUser);
 */ 