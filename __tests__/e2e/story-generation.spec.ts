import { test, expect } from '@playwright/test';

test.describe('Story Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
  });

  test('should generate a story with valid inputs', async ({ page }) => {
    // Fill in the story form
    await page.selectOption('[data-testid="story-age"]', '4-8');
    await page.fill('[data-testid="story-characters"]', 'A brave little rabbit');
    await page.fill('[data-testid="story-setting"]', 'A magical forest');
    await page.fill('[data-testid="story-moral"]', 'Being kind to others');
    await page.selectOption('[data-testid="story-tone"]', 'warm, comforting');
    await page.selectOption('[data-testid="story-length"]', 'medium');
    
    // Submit the form
    await page.click('[data-testid="generate-story"]');
    
    // Wait for navigation to story page
    await page.waitForURL('/story');
    
    // Verify the story page loaded
    const storyContent = await page.textContent('main');
    expect(storyContent).toBeTruthy();
  });

  test('should show error message with invalid inputs', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="generate-story"]');
    
    // Verify error messages
    const ageError = await page.textContent('[data-testid="story-age"] + .error-message');
    const charactersError = await page.textContent('[data-testid="story-characters"] + .error-message');
    
    expect(ageError).toContain('Age is required');
    expect(charactersError).toContain('Characters are required');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/generate-story', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Fill in valid form
    await page.selectOption('[data-testid="story-age"]', '4-8');
    await page.fill('[data-testid="story-characters"]', 'A brave little rabbit');
    await page.fill('[data-testid="story-setting"]', 'A magical forest');
    await page.fill('[data-testid="story-moral"]', 'Being kind to others');
    await page.selectOption('[data-testid="story-tone"]', 'warm, comforting');
    await page.selectOption('[data-testid="story-length"]', 'medium');
    
    await page.click('[data-testid="generate-story"]');

    // Verify error message
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('Failed to generate story');
  });
}); 