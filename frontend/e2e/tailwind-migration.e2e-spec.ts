import { expect, test } from '@playwright/test';

const executiveDashboard = {
  orgId: 1,
  orgName: 'E2E Organization',
  targetReductionPercent: 20,
  approvedCount: 1,
  avgApprovedScore: 85,
  latestCertifiedLevel: 'GOLD',
  netZeroProgressPercent: 25,
  approvedAssessments: [
    {
      id: 10,
      assessmentYear: 2026,
      totalScore: 85,
      certifiedLevel: 'GOLD',
      approvedAt: '2026-08-31T00:00:00.000Z',
    },
  ],
  carbonByScope: [],
  carbonByUnit: [{ unitName: 'สำนักงานใหญ่', totalEmission: 10 }],
};

test.describe('Tailwind migration regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'e2e-token');
      localStorage.setItem(
        'currentUser',
        JSON.stringify({ id: 1, email: 'executive@example.test', role: 'EXECUTIVE' }),
      );
      localStorage.setItem('currentOrg', JSON.stringify({ id: 1, name: 'E2E Organization' }));
    });
    await page.route('**/api/executive/dashboard', (route) =>
      route.fulfill({ json: executiveDashboard }),
    );
    await page.route('**/api/executive/leaderboard**', (route) =>
      route.fulfill({
        json: [
          {
            rank: 1,
            unitName: 'สำนักงานใหญ่',
            totalEmission: 10,
            reductionPercent: 12,
            badge: '🥇 ทองคำ',
            assessmentScore: 85,
          },
        ],
      }),
    );
  });

  test('renders audit summary from persisted assessment data on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/executive/audit-summary');

    await expect(page.getByText('ผลประเมินปี 2026')).toBeVisible();
    await expect(page.getByText('85%')).toBeVisible();
    await expect(page.getByText(/API ปัจจุบันยังไม่มีคะแนนแยกรายหมวด/)).toBeVisible();
  });

  test('keeps the leaderboard controls usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/executive/leaderboard');

    await expect(page.getByRole('button', { name: /อัปเดตข้อมูล/ })).toBeVisible();
    await expect(page.getByText('E2E Organization')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'สำนักงานใหญ่' })).toBeVisible();
  });
});
