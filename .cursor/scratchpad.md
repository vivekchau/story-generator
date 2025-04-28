# Bedtime Story Generator - Test Planning Document

## Background and Motivation
The bedtime story generator needs comprehensive testing to ensure reliability and maintainability. We need to implement various types of tests (unit, integration, end-to-end) to catch bugs early and maintain code quality.

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