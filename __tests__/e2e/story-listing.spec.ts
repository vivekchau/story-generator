import { test, expect } from '@playwright/test';

test.describe('Story Listing Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stories');
  });

  test('should display list of stories when authenticated', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user-id', name: 'Test User' } }),
      });
    });

    // Mock stories API response
    await page.route('**/api/stories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'The Brave Rabbit',
            content: 'Once upon a time...',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'The Magic Forest',
            content: 'In a land far away...',
            createdAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // Verify stories are displayed
    const storyTitles = await page.$$eval('[data-testid="story-title"]', (elements) =>
      elements.map((el) => el.textContent)
    );
    expect(storyTitles).toContain('The Brave Rabbit');
    expect(storyTitles).toContain('The Magic Forest');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Mock unauthenticated session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Verify redirect to login page
    await page.waitForURL('/login');
    const loginTitle = await page.textContent('h1');
    expect(loginTitle).toContain('Sign In');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user-id', name: 'Test User' } }),
      });
    });

    // Mock stories API error
    await page.route('**/api/stories', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Verify error message is displayed
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Failed to load stories');
  });

  test('should display empty state when no stories exist', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user-id', name: 'Test User' } }),
      });
    });

    // Mock empty stories response
    await page.route('**/api/stories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Verify empty state message
    const emptyState = await page.textContent('[data-testid="empty-state"]');
    expect(emptyState).toContain('No stories found');
  });
}); 