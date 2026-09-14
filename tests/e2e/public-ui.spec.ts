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
    await expect(page.getByText(/internal platform for managing and generating/i)).toBeVisible();
    await expect(page.getByText(/dashboard preview|statistics|features/i)).toHaveCount(0);
    await expect(page.getByText(/sign up|register|create account/i)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const primary = page.getByRole('link', { name: 'Officer Login', exact: true }).last();
    const arrow = primary.locator('svg');
    await primary.hover();
    await expect(arrow).toHaveCSS('transform', /matrix\(1, 0, 0, 1, [1-5](?:\.\d+)?, 0\)/);
    await primary.click({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/login$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Officer Login' }).first()).toBeVisible();
    await expect(page.getByLabel('Officer Email')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByText(/sign up|register|continue with google/i)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
