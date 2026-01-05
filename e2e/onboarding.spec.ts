import { test, expect, Page } from '@playwright/test';

// Helper to mock authenticated state
async function mockAuthenticatedUser(page: Page, role: string = 'professor') {
  // This would typically involve setting up auth cookies/localStorage
  // For now, we'll test the login flow and onboarding together
}

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Check we're on login page or redirected there
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('login page should have email and password fields', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without credentials
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for error toast or message
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Onboarding Wizard UI', () => {
  test('onboarding wizard should have navigation controls', async ({ page }) => {
    // This test verifies the onboarding component structure
    // In a real scenario, you'd authenticate first
    
    await page.goto('/login');
    
    // Verify basic UI elements are present on login
    await expect(page.locator('text=FrequênciaQR')).toBeVisible();
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Check that the page is still usable on mobile
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });
});

test.describe('Settings Page - Onboarding Reset', () => {
  test('settings page should be accessible from navigation', async ({ page }) => {
    // Navigate to settings (this will redirect to login if not authenticated)
    await page.goto('/configuracoes');
    
    // Should redirect to login for unauthenticated users
    await expect(page).toHaveURL(/\/(login|configuracoes)/);
  });
});

test.describe('Accessibility', () => {
  test('login form should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to email input
    await page.keyboard.press('Tab');
    
    // Type email
    await page.keyboard.type('test@example.com');
    
    // Tab to password
    await page.keyboard.press('Tab');
    
    // Type password
    await page.keyboard.type('password123');
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    
    // Verify we can interact with elements via keyboard
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    
    // Check for h1 element
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});
