import { test, expect } from '@playwright/test';

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]) {
  test(`landing and login remain focused at ${viewport.name} size`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to the ID Generator.' })).toBeVisible();
    await expect(page.getByText('Authorized officers only.')).toBeVisible();
    await expect(page.getByText(/dashboard preview|statistics|features/i)).toHaveCount(0);
    await expect(page.getByText(/sign up|register|create account/i)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const primary = page.getByRole('link', { name: 'Login', exact: true }).last();
    const arrow = primary.locator('.internal-action-arrow');
    await primary.hover();
    await expect(arrow).toHaveCSS('transform', /matrix\(1, 0, 0, 1, [1-5](?:\.\d+)?, 0\)/);
    await primary.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Officer Login' })).toBeVisible();
    await expect(page.getByLabel('Officer Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByText(/sign up|register|continue with google/i)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
