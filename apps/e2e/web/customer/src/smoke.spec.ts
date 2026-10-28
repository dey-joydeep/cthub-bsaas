import { test, expect } from '@playwright/test';

test.describe('Customer Web App - SSR Hydration Smoke Tests', () => {
  test('should deliver server-side rendered initial HTML with pre-rendered content and hydration markers', async ({ request, baseURL }) => {
    const response = await request.get(baseURL || '/');
    expect(response.status()).toBeLessThan(400);

    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');

    // Verify server-rendered markup exists inside app-root rather than an empty placeholder
    const appRootMatch = html.match(/<app-root[^>]*>([\s\S]*?)<\/app-root>/);
    expect(appRootMatch).not.toBeNull();
    expect(appRootMatch?.[1]?.trim().length).toBeGreaterThan(0);

    // Verify Angular server rendering metadata (ng-version attribute stamped on host)
    expect(html).toMatch(/<app-root[^>]+ng-version=/);

    // Verify transfer state script ID matches client APP_ID (does not use discordant server-only ID)
    expect(html).not.toContain('id="server-app-state"');
  });

  test('should hydrate client-side without errors and redirect to auth when unauthenticated', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const pageErrors: Error[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    // Navigate to root
    await page.goto('/');

    // Verify auth redirection under web-core-auth
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Verify app-root is present, rendered, and hydrated
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
    await expect(appRoot).toHaveAttribute('ng-version');

    // Verify login form is rendered
    await expect(page.locator('form, input[type="email"], input[type="password"]').first()).toBeVisible();

    // Verify no hydration mismatch errors or warnings (e.g., NG0500, missing metadata, hydration disabled)
    const hydrationIssues = [...consoleErrors, ...consoleWarnings].filter(
      (msg) => msg.includes('NG050') || msg.toLowerCase().includes('hydration') || msg.toLowerCase().includes('missing-metadata'),
    );
    expect(hydrationIssues).toHaveLength(0);

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
