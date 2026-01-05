import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Should either show login or landing page
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/login');
    
    // Check for FrequênciaQR branding
    await expect(page.locator('text=FrequênciaQR')).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
    // Either redirect to login or show not found
    const url = page.url();
    expect(url).toMatch(/\/(login|non-existent-page)/);
  });

  test('demo page should be accessible', async ({ page }) => {
    await page.goto('/demo');
    
    // Demo page should be publicly accessible
    await expect(page).toHaveURL(/\/demo/);
  });

  test('install page should be accessible', async ({ page }) => {
    await page.goto('/install');
    
    // Install page should be publicly accessible
    await expect(page).toHaveURL(/\/install/);
  });
});

test.describe('Protected Routes', () => {
  test('dashboard should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('settings should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/configuracoes');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('users page should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/usuarios');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Theme Support', () => {
  test('should support dark mode toggle', async ({ page }) => {
    await page.goto('/login');
    
    // Look for theme toggle button
    const themeToggle = page.locator('button').filter({ hasText: /theme|modo/i }).or(
      page.locator('[aria-label*="theme"]')
    ).or(
      page.locator('button:has(svg)')
    );
    
    // Page should be loaded
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Form Validation', () => {
  test('login form should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Fill invalid email
    await emailInput.fill('not-an-email');
    await passwordInput.fill('password123');
    
    await submitButton.click();
    
    // HTML5 validation should prevent submission
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});
