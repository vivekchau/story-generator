# Bedtime Story Generator - Test Planning Document

## Background and Motivation
The bedtime story generator needs comprehensive testing to ensure reliability and maintainability. We need to implement various types of tests (unit, integration, end-to-end) to catch bugs early and maintain code quality.

**Recent Issue Fixed**: Multiple title options were appearing instead of a single title. This was caused by the AI model sometimes returning multiple title suggestions instead of just one. The fix involved:
1. Making the title generation prompt more specific to request only one title
2. Adding title cleaning logic to remove numbering, bullet points, and multiple options
3. Ensuring only the first title option is used

**Recent Issue Fixed**: localStorage quota exceeded error when generating images. This was caused by storing large image URLs in localStorage, which has a size limit. The fix involved:
1. Creating a safe storage function that doesn't store image URLs in localStorage
2. Adding error handling for localStorage quota exceeded errors
3. Implementing automatic cleanup of old stories when storage is full
4. Using fallback storage strategies when localStorage fails

## Key Challenges and Analysis
1. API Route Testing ✅
   - Mock authentication/session
   - Mock database interactions
   - Handle different response scenarios

2. Data Validation Testing ✅
   - Ensure proper validation of story data
   - Test edge cases and invalid inputs
   - Verify data cleaning functionality

3. Integration Points
   - Test interaction between frontend and API
   - Test database operations
   - Test authentication flow

4. Title Generation Issues ✅
   - Fixed multiple title options appearing
   - Added title cleaning logic
   - Improved prompt specificity

5. localStorage Storage Issues ✅
   - Fixed quota exceeded errors when storing large story data
   - Implemented safe storage strategy without image URLs
   - Added automatic cleanup of old stories
   - Added error handling for storage failures

## High-level Task Breakdown

### 1. Setup Testing Environment ✅
- [x] Install necessary testing libraries
- [x] Configure test environment and scripts
- [x] Setup test database configuration
- Success Criteria: Running `npm test` executes the test suite

### 2. Unit Tests ✅
- [x] Story API Route Tests
  - Test POST endpoint
  - Test GET endpoint
  - Test validation functions
- [x] Data Model Tests
  - Test Story interface
  - Test data cleaning functions
- Success Criteria: All unit tests pass with >80% coverage

### 3. Integration Tests
- [ ] Database Integration Tests
  - Test story creation with real database operations
  - Test story retrieval with filtering and sorting
  - Test concurrent operations
  - Test database constraints and relationships
- [ ] Authentication Integration Tests
  - Test protected routes
  - Test session handling
- Success Criteria: All integration tests pass with proper error handling

### 4. End-to-End Tests
- [ ] User Flow Tests
  - Test story creation flow
  - Test story listing flow
  - Test error scenarios
- Success Criteria: All E2E tests pass simulating real user interactions

## Project Status Board
- [x] Task 1: Setup Testing Environment
- [x] Task 2: Implement Unit Tests
- [x] Task 3.1: Database Test Utilities
- [x] Task 3.2: Story API Integration Tests - Authentication
- [x] Task 3.3: Story API Integration Tests - Story Creation
- [x] Task 3.4: Story API Integration Tests - Story Retrieval
- [x] Task 3.5: Authentication Integration Tests
- [ ] Task 4: Implement E2E Tests
  - [ ] Create E2E test directory and setup
  - [ ] Implement story creation flow tests
  - [ ] Implement story listing flow tests
  - [ ] Implement error scenario tests

## Testing Best Practices
1. Test Flow Pattern
   ```
   Setup -> Action -> Assert
   ```
   - Setup: Prepare test data and mocks
   - Action: Execute the functionality being tested
   - Assert: Verify the results

2. Debugging Checklist
   ```
   1. Read error messages completely
   2. Check mock setup
   3. Verify operation order
   4. Compare with real app flow
   5. Review test infrastructure
   ```

3. Test Structure Template
   ```typescript
   describe('Feature or Component', () => {
     beforeEach(() => {
       // Setup common test data
     });

     it('should [expected behavior] when [condition]', async () => {
       // Setup specific to this test
       // Action
       // Assert
     });
   });
   ```

## Current Focus: End-to-End Tests

### Next Steps: Implement E2E Test Suite
1. Setup E2E Testing Environment
   - Create E2E test directory
   - Configure Playwright/Cypress
   - Setup test database
   - Success Criteria: E2E test environment is ready

2. Story Creation Flow Tests
   - Test user login
   - Test story creation form
   - Test form validation
   - Test successful story creation
   - Success Criteria: Full story creation flow works correctly

3. Story Listing Flow Tests
   - Test story list page
   - Test story filtering
   - Test story sorting
   - Test pagination
   - Success Criteria: Story listing functionality works correctly

4. Error Scenario Tests
   - Test invalid login
   - Test invalid story data
   - Test network errors
   - Test database errors
   - Success Criteria: Error handling works correctly

## Lessons
- Always write tests before implementing new features (TDD approach)
- Mock external dependencies for reliable testing
- Use descriptive test names that explain the expected behavior
- Keep test data isolated to prevent test interference
- Clean up test data after each test run
- Use separate test database to avoid affecting development data
- Create reusable test utilities for common operations
- Use separate Jest configurations for different test environments (node vs jsdom)
- Always verify database connection strings before running migrations
- Keep test database isolated from development database
- Use separate test utilities for different types of tests (database, API, etc.)
- Create data factories to generate consistent test data
- Always clean up test data between test runs
- Test both success and error scenarios
- Use Jest mocks for external dependencies like authentication
- Test both success and error cases for authentication
- Verify response status codes and error messages
- Clean up test data and reset mocks between tests
- Maintain consistency between test utilities and test expectations
- Document default test data values to prevent mismatches
- When tests fail, check for inconsistencies in test data first
- Test both minimal and complete data scenarios
- Include error handling tests for database operations
- Test data cleaning operations (like whitespace trimming)
- Use descriptive test data that reflects real use cases
- Test both empty and populated result sets
- Verify sorting and ordering of results
- Test handling of large data sets
- Include session validation in integration tests
- "should handle database errors during session validation"
- "should handle rate limiting for authentication attempts"
- "should handle token refresh errors"
- Prisma does not support nested transactions. When testing database operations that need to be atomic, use a single transaction block that includes all the operations.
- When using transactions in tests, always ensure proper cleanup in a finally block to maintain test isolation
- New Lessons:
  - Mock operations should follow the same sequence as real operations
  - Check test infrastructure before modifying test logic
  - Error messages often point directly to the root cause

### Recent Test Infrastructure Learnings
1. Mock Sequencing
   - Mocks must follow the same sequence as real operations
   - Authentication checks must precede database operations
   - Error simulation should occur at appropriate points

2. Test Infrastructure Design
   - Check test utilities before modifying test logic
   - Document mock behavior and sequence
   - Keep mock implementation close to real implementation

3. Debugging Efficiency
   - Error messages often contain root cause
   - Check mock call counts and arguments
   - Verify test infrastructure before test logic
   - Follow real application flow in tests

4. Test Organization
   - Group related tests logically
   - Use descriptive test names
   - Document test dependencies
   - Maintain clear setup and teardown procedures

declare global {
  var prisma: PrismaClient | undefined
}

if (typeof window !== 'undefined') {
  throw new Error('PrismaClient cannot be instantiated in a browser environment')
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'test') {
    return new PrismaClient({ log: ['error'] })
  }
  // ...
}

const prisma = global.prisma || getPrismaClient()

(prismaMocks.user.findUnique as jest.Mock).mockResolvedValue(testUser);
(prismaMocks.session.create as jest.Mock).mockResolvedValue(sessionData);

Test Flow:
1. Set up mock session
2. Validate authentication
3. Attempt database operation
4. Handle errors

// Pattern 1: Setup, Action, Assert
// Setup
const mockSession = createMockSession();
getServerSessionMock.mockResolvedValueOnce(mockSession);

// Action
const response = await fetch('/api/protected');

// Assert
expect(getServerSessionMock).toHaveBeenCalled(); 

/**
 * ApiRequestHandler: Simulates API requests with authentication and database operations
 * 
 * Order of operations:
 * 1. Session validation (using getServerSession)
 * 2. Database operations (can be configured to fail)
 * 3. Response generation
 */ 

expect(data.success).toBe(true);
expect(typeof data.expires).toBe('string');
expect(new Date(data.expires).getTime()).toBeGreaterThan(Date.now()); 

# Download Authentication Feature

## Background and Motivation
- Currently, any user can download stories without authentication
- We want to restrict downloads to logged-in users only
- This will help track user engagement and protect content
- We'll use Google Auth for authentication

## Key Challenges and Analysis
1. Need to handle unauthenticated download attempts gracefully
2. Must maintain the user's intended download after authentication
3. Need to ensure smooth user experience with minimal friction
4. Must handle edge cases (e.g., auth failure, network issues)

## High-level Task Breakdown

### 1. Frontend Changes
- [ ] Add authentication check to download button component
- [ ] Create download button wrapper component that handles auth state
- [ ] Implement auth redirect flow with return URL
- [ ] Add loading state during auth process
- [ ] Update UI to show login prompt for unauthenticated users

### 2. Backend Changes
- [ ] Add authentication check to download API endpoint
- [ ] Implement session validation
- [ ] Add error handling for unauthenticated requests
- [ ] Update API response structure to include auth status

### 3. Authentication Flow
- [ ] Implement auth state persistence
- [ ] Add return URL handling after successful login
- [ ] Create auth middleware for protected routes
- [ ] Handle session expiry and refresh

### 4. Testing
- [ ] Add unit tests for auth checks
- [ ] Add integration tests for download flow
- [ ] Test edge cases (session expiry, network issues)
- [ ] Add E2E tests for complete user journey

## Project Status Board
- [ ] Frontend Changes
  - [ ] Create DownloadButton component with auth check
  - [ ] Implement auth redirect flow
  - [ ] Add loading states
  - [ ] Update UI for unauthenticated users
- [ ] Backend Changes
  - [ ] Update download API endpoint
  - [ ] Add session validation
  - [ ] Implement error handling
- [ ] Authentication Flow
  - [ ] Implement auth state persistence
  - [ ] Add return URL handling
  - [ ] Create auth middleware
- [ ] Testing
  - [ ] Write unit tests
  - [ ] Write integration tests
  - [ ] Add E2E tests

## Success Criteria
1. Unauthenticated users see a login prompt when trying to download
2. After successful login, users are redirected back to the download page
3. Download works automatically after successful authentication
4. Session expiry is handled gracefully
5. All edge cases are properly handled with appropriate error messages
6. Tests cover all major scenarios

## Executor's Feedback or Assistance Requests
- Ready to begin implementation
- Need confirmation on the approach before proceeding

## Lessons
- Keep track of user's intended action during auth flow
- Ensure smooth user experience with minimal redirects
- Handle all edge cases gracefully
- Test thoroughly for different auth scenarios 

# Database Connection Testing Plan

## Background and Motivation
The application was working fine previously, but after restarting the Supabase database, we're seeing connection errors. We need to systematically verify all components to identify where the issue might be.

## Key Challenges and Analysis
1. Database connection might need time to fully initialize after restart
2. Connection string might need verification
3. Network connectivity needs to be checked
4. Prisma client configuration needs verification
5. Authentication flow needs to be tested

## High-level Task Breakdown

### 1. Basic Network Connectivity Tests
- [ ] Ping database host
- [ ] Check DNS resolution
- [ ] Verify port accessibility
- [ ] Test basic TCP connection

### 2. Database Connection String Verification
- [ ] Verify DATABASE_URL format
- [ ] Check password encoding
- [ ] Validate hostname
- [ ] Confirm port number
- [ ] Verify database name

### 3. Prisma Client Tests
- [ ] Test basic Prisma connection
- [ ] Verify Prisma client initialization
- [ ] Test simple query execution
- [ ] Check transaction handling
- [ ] Verify error handling

### 4. Authentication Flow Tests
- [ ] Test database adapter initialization
- [ ] Verify NextAuth configuration
- [ ] Test Google OAuth flow
- [ ] Check session handling
- [ ] Verify user creation/retrieval

### 5. Application Integration Tests
- [ ] Test story creation
- [ ] Verify user-story relationship
- [ ] Check data persistence
- [ ] Test data retrieval

## Project Status Board
- [ ] Complete network connectivity tests
- [ ] Complete database connection string verification
- [ ] Complete Prisma client tests
- [ ] Complete authentication flow tests
- [ ] Complete application integration tests

## Executor's Feedback or Assistance Requests
(To be filled as we progress through the tests)

## Lessons
1. Always verify database connection after restart
2. Keep track of connection string changes
3. Document any configuration changes 

# Migration from OpenAI APIs to Fireworks AI (Open Source Models)

## Background and Motivation
- The current application uses OpenAI APIs for both language (story generation) and image generation.
- The goal is to switch to open-source models hosted on Fireworks AI to reduce costs, increase flexibility, and avoid vendor lock-in.
- Fireworks AI provides API access to open-source LLMs (like Llama, Mistral, etc.) and image models (like Stable Diffusion).

## Key Challenges and Analysis
1. **API Differences:** Fireworks AI APIs may have different endpoints, authentication, and request/response formats compared to OpenAI.
2. **Model Selection:** Need to choose suitable open-source models for both text and image generation that match the quality and speed of OpenAI's models.
3. **Code Refactoring:** All code that calls OpenAI APIs must be updated to use Fireworks AI APIs instead.
4. **Testing:** Ensure that the new models produce acceptable results and that all features (story generation, image generation, PDF download, etc.) still work.
5. **Environment Variables:** Update environment variables and secrets to use Fireworks AI credentials.
6. **Documentation:** Update documentation and code comments to reflect the new setup.

## High-level Task Breakdown

### 1. Discovery & Analysis
- [ ] Identify all code that uses OpenAI APIs (text and image generation)
- [ ] Review Fireworks AI documentation for language and image APIs
- [ ] Select appropriate models from Fireworks AI

### 2. Refactor API Integration
- [ ] Update environment variables to store Fireworks AI API keys
- [ ] Replace OpenAI API calls with Fireworks AI API calls for text generation
- [ ] Replace OpenAI API calls with Fireworks AI API calls for image generation
- [ ] Refactor request/response handling as needed

### 3. Testing & Validation
- [ ] Test story generation with Fireworks AI LLMs
- [ ] Test image generation with Fireworks AI image models
- [ ] Test PDF download and UI integration
- [ ] Handle errors and edge cases

### 4. Documentation & Cleanup
- [ ] Update README and code comments
- [ ] Remove unused OpenAI code and environment variables

## Success Criteria
1. All story and image generation features work using Fireworks AI APIs
2. No OpenAI API calls remain in the codebase
3. Quality of generated stories and images is acceptable
4. All tests pass and manual testing confirms functionality
5. Documentation is up to date

## Project Status Board
- [ ] Discovery & Analysis
  - [ ] Identify OpenAI usage in codebase
  - [ ] Review Fireworks AI docs
  - [ ] Select models
- [ ] Refactor API Integration
  - [ ] Update env vars
  - [ ] Replace text generation
  - [ ] Replace image generation
  - [ ] Refactor request/response
- [ ] Testing & Validation
  - [ ] Test story gen
  - [ ] Test image gen
  - [ ] Test PDF/UI
  - [ ] Handle errors
- [ ] Documentation & Cleanup
  - [ ] Update docs
  - [ ] Remove OpenAI code

## Executor's Feedback or Assistance Requests
- Awaiting user confirmation to proceed with Discovery & Analysis phase.

## Lessons
- Always check for API differences (auth, endpoints, payloads)
- Test new models for quality before full migration
- Keep old code until new integration is fully validated 