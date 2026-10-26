import { test, expect } from '@playwright/test';

test.describe('Customer Web App - SSR Hydration Smoke Tests', () => {
  test('should deliver server-side rendered initial HTML', async ({ request, baseURL }) => {
    const response = await request.get(baseURL || '/');
    expect(response.status()).toBeLessThan(400);

    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<app-root');
  });

  test('should hydrate client-side without errors and redirect to auth when unauthenticated', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    // Navigate to root
    await page.goto('/');

    // Verify auth redirection under web-core-auth
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Verify app-root is present and hydrated
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();

    // Verify login form is rendered
    await expect(page.locator('form, input[type="email"], input[type="password"]').first()).toBeVisible();

    // Verify no hydration mismatch errors (e.g., NG0500)
    const hydrationErrors = consoleErrors.filter((msg) => msg.includes('NG0500') || msg.includes('NG0501') || msg.includes('hydration'));
    expect(hydrationErrors).toHaveLength(0);

    // Verify no unhandled page errors
    expect(pageErrors).toHaveLength(0);
  });

  test('should navigate between auth routes cleanly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('app-root')).toBeVisible();

    // Navigate to forgot-password
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
    await expect(page.locator('app-root')).toBeVisible();
  });
});
