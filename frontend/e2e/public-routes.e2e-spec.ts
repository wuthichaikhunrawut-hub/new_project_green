import { expect, test } from '@playwright/test';

test.describe('Public and authentication routes', () => {
  test('renders the login page without a backend dependency', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('keeps protected routes behind authentication', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('publishes the privacy policy in the Thai document', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.locator('html')).toHaveAttribute('lang', 'th');
    await expect(page.locator('body')).toContainText(/ความเป็นส่วนตัว|ข้อมูลส่วนบุคคล/);
  });
});
