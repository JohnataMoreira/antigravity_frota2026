import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Frota2026/);
});

test('login page loads', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /Entrar/i })).toBeVisible();
    // Using exact placeholders from Login.tsx
    await expect(page.getByPlaceholder('exemplo@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible();
});
