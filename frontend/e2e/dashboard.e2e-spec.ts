import { test, expect } from '@playwright/test';

test.describe('Authenticated dashboard route smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'e2e-token');
      localStorage.setItem(
        'currentUser',
        JSON.stringify({ id: 1, email: 'executive@example.test', role: 'EXECUTIVE' }),
      );
      localStorage.setItem('currentOrg', JSON.stringify({ id: 1, name: 'E2E Organization' }));
    });

    await page.route('**/api/**', async (route) => {
      await route.fulfill({ json: {} });
    });

    // Navigate to dashboard and intercept AI API calls
    await page.route('**/gemini/recommendations', async (route) => {
      const json = {
        recommendations: [
          { title: 'Test Action', action: 'Test Description', expectedImpact: 'High' },
        ],
      };
      await route.fulfill({ json });
    });

    await page.route('**/gemini/executive-summary', async (route) => {
      const json = { summary: 'Mock AI Executive Summary for E2E testing.' };
      await route.fulfill({ json });
    });
  });

  test('loads the main dashboard shell for an authenticated user', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if the dashboard title exists
    await expect(page.locator('.dash-header-title')).toContainText('Green Sync');

    // The shell must remain usable even when optional analytics APIs return no data.
    await expect(page.locator('.ai-insights-header')).toBeVisible();
  });

  test('loads the current executive dashboard shell', async ({ page }) => {
    await page.goto('/executive/dashboard');

    await expect(page.locator('h1')).toContainText('วิเคราะห์ข้อมูลอัจฉริยะสำหรับผู้บริหาร');
  });
});
