import { test, expect } from '@playwright/test';

test('E2E: Login and Navigate', async ({ page }) => {
    // 1. Visit App
    await page.goto('/');

    // 2. Check Landing Page or Login
    await expect(page).toHaveTitle(/Vendas/i);

    // 3. Simple Login Attempt (if elements visible)
    const emailInput = page.getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
        await emailInput.fill('admin@test.com');
        await page.getByPlaceholder(/password/i).fill('password123');
        await page.getByRole('button', { name: /entrar/i }).click();

        // 4. Verify Dashboard access (timeout adjusted)
        await expect(page.getByText('Eventos Ativos')).toBeVisible({ timeout: 15000 });
    }
});
