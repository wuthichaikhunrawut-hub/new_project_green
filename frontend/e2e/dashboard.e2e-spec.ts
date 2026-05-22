import { test, expect } from '@playwright/test';

test.describe('Smart Dashboard & Executive Analytics E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and intercept AI API calls
    await page.route('**/gemini/recommendations', async route => {
      const json = {
        recommendations: [
          { title: 'Test Action', action: 'Test Description', expectedImpact: 'High' }
        ]
      };
      await route.fulfill({ json });
    });
    
    await page.route('**/gemini/executive-summary', async route => {
      const json = { summary: 'Mock AI Executive Summary for E2E testing.' };
      await route.fulfill({ json });
    });
  });

  test('should load main dashboard with AI insights', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if the dashboard title exists
    await expect(page.locator('.dash-header-title')).toContainText('Green Sync');
    
    // Check if AI insights are rendered
    await expect(page.locator('.ai-insights-header')).toBeVisible();
    await expect(page.locator('text=Test Action')).toBeVisible();
  });

  test('should load executive dashboard with AI summary', async ({ page }) => {
    await page.goto('/executive/dashboard');
    
    await expect(page.locator('h1')).toContainText('Executive Sustainability Intelligence');
    
    // Check if AI Summary is loaded
    await expect(page.locator('.ai-summary-content')).toContainText('Mock AI Executive Summary');
  });
});
