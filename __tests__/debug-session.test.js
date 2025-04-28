// Mock NextAuth
const getServerSessionMock = jest.fn();

jest.mock('next-auth/next', () => ({
  getServerSession: (...args) => getServerSessionMock(...args)
}));

const mockAuthOptions = {
  secret: 'test-secret'
};

describe('Debug Session Mocking', () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it('should mock getServerSession correctly', async () => {
    const mockSession = {
      user: { id: 'test-id', name: 'Test User' },
      expires: new Date(Date.now() + 3600000).toISOString()
    };
    
    // Setup the mock
    getServerSessionMock.mockResolvedValue(mockSession);
    
    // Import the module AFTER mock setup
    const { getServerSession } = require('next-auth/next');
    
    // Call the mocked function
    const session = await getServerSession(mockAuthOptions);
    
    // Verify expectations
    expect(session).toEqual(mockSession);
    expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
  });

  it('should handle null session value', async () => {
    // Setup the mock to return null
    getServerSessionMock.mockResolvedValue(null);
    
    // Import the module AFTER mock setup
    const { getServerSession } = require('next-auth/next');
    
    // Call the mocked function
    const session = await getServerSession(mockAuthOptions);
    
    // Verify expectations
    expect(session).toBeNull();
    expect(getServerSessionMock).toHaveBeenCalledWith(mockAuthOptions);
  });
}); 