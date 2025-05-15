import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Mock successful authentication
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user-id', name: 'Test User' } }),
      });
    });

    // Submit form
    await page.click('[data-testid="signin-button"]');

    // Verify redirect to stories page
    await page.waitForURL('/stories');
    const pageTitle = await page.textContent('h1');
    expect(pageTitle).toContain('My Stories');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Mock failed authentication
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });

    // Submit form
    await page.click('[data-testid="signin-button"]');

    // Verify error message
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Invalid email or password');
  });

  test('should handle network errors during sign in', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Mock network error
    await page.route('**/api/auth/callback/credentials', async (route) => {
      await route.abort('failed');
    });

    // Submit form
    await page.click('[data-testid="signin-button"]');

    // Verify error message
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Network error');
  });

  test('should allow user to sign out', async ({ page }) => {
    // Start authenticated
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user-id', name: 'Test User' } }),
      });
    });

    await page.goto('/stories');

    // Mock successful sign out
    await page.route('**/api/auth/signout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Click sign out button
    await page.click('[data-testid="signout-button"]');

    // Verify redirect to login page
    await page.waitForURL('/login');
    const loginTitle = await page.textContent('h1');
    expect(loginTitle).toContain('Sign In');
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Mock unauthenticated session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Try to access protected route
    await page.goto('/stories');

    // Verify redirect to login page
    await page.waitForURL('/login');
    const loginTitle = await page.textContent('h1');
    expect(loginTitle).toContain('Sign In');
  });
}); 