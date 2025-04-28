import { Session } from 'next-auth';

// Mock Response class for simulating API responses
export class MockResponse {
  status: number;
  body: any;
  headers: Map<string, string>;

  constructor(body: any, status = 200, headers = new Map()) {
    this.status = status;
    this.body = body;
    this.headers = headers;
  }

  json() {
    return Promise.resolve(this.body);
  }

  text() {
    return Promise.resolve(JSON.stringify(this.body));
  }
}

// Create mock user data
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  ...overrides
});

// Create mock session data
export const createMockSession = (userOverrides = {}, sessionOverrides = {}): Session => ({
  user: createMockUser(userOverrides),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  ...sessionOverrides
});

// Create expired session data
export const createExpiredSession = (userOverrides = {}, sessionOverrides = {}): Session => ({
  ...createMockSession(userOverrides, sessionOverrides),
  expires: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
});

// API request handler for mocking fetch responses
export class ApiRequestHandler {
  private mockResponses: Map<string, MockResponse>;
  private requestCounts: Map<string, number>;
  private dbError: Error | null = null;

  constructor(private getServerSession: (options: any) => Promise<Session | null>) {
    this.mockResponses = new Map();
    this.requestCounts = new Map();
  }

  setDatabaseError(error: Error | null) {
    this.dbError = error;
  }

  resetRequestCount(path: string) {
    this.requestCounts.set(path, 0);
  }

  async mockResponse(path: string, response: { status: number; json: () => Promise<any> }) {
    const responseJson = await response.json();
    this.mockResponses.set(path, new MockResponse(responseJson, response.status));
  }

  async mockFetch(url: string, options?: RequestInit) {
    try {
      // Track request count for rate limiting
      const urlPath = new URL(url).pathname;
      const currentCount = this.requestCounts.get(urlPath) || 0;
      this.requestCounts.set(urlPath, currentCount + 1);

      // Check for mocked response
      const mockedResponse = this.mockResponses.get(urlPath);
      if (mockedResponse) {
        return mockedResponse;
      }

      // Check for rate limiting
      if (urlPath === '/api/auth/signin' && currentCount >= 5) {
        return new MockResponse({ error: 'Too many requests' }, 429);
      }

      // Call getServerSession with mockAuthOptions
      const session = await this.getServerSession(mockAuthOptions);

      // If there's a database error, throw it after session validation
      if (this.dbError) {
        throw this.dbError;
      }
      
      if (url.includes('/api/protected')) {
        if (!session) {
          return new MockResponse({ error: 'Unauthorized' }, 401);
        }
        if (session.expires && new Date(session.expires) < new Date()) {
          return new MockResponse({ error: 'Session expired' }, 401);
        }
        return new MockResponse({ success: true }, 200);
      }
      
      if (url.includes('/api/auth/signin')) {
        return new MockResponse({ success: true }, 200);
      }
      
      if (url.includes('/api/stories') || 
          url.includes('/api/stories/create') || 
          url.includes('/api/user/profile')) {
        if (!session) {
          return new MockResponse({ error: 'Unauthorized' }, 401);
        }
        return new MockResponse({ success: true }, 200);
      }
      
      if (url.includes('/api/auth/refresh')) {
        if (!session) {
          return new MockResponse({ error: 'Unauthorized' }, 401);
        }
        return new MockResponse({ success: true, expires: session.expires }, 200);
      }
      
      return new MockResponse({ success: true }, 200);
    } catch (error) {
      console.error('API Request Handler Error:', error);
      return new MockResponse(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  }
}

// Prisma mock factory
export const createPrismaMocks = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  session: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
});

// Auth options mock
export const mockAuthOptions = {
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
}; 