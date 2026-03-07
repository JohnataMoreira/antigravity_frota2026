import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Fluxos Críticos', () => {

    test('deve permitir login e verificar branding da organização', async ({ page }) => {
        // 1. Login (Mocking API calls is preferred if we don't have a test DB, 
        // but for a smoke test we usually use real credentials or a seed)
        await page.goto('/login');

        // Preenche dados (usando placeholders baseados no código anterior)
        await page.getByPlaceholder('Email corporativo').fill('admin@frota2026.com.br');
        await page.getByPlaceholder('Sua senha').fill('123456');
        await page.getByRole('button', { name: /entrar/i }).click();

        // 2. Verifica se chegou ao Dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // 3. Verifica Branding (Logo no Sidebar)
        // No DashboardLayout, a logo tem a classe h-14 ou h-8 no mobile
        const logo = page.locator('aside img');
        await expect(logo).toBeVisible();

        // 4. Verifica se a cor primária foi aplicada (CSS Variable)
        const primaryColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        });
        expect(primaryColor).not.toBe('');
    });

    test('deve navegar até Veículos e abrir o modal de cadastro', async ({ page }) => {
        await page.goto('/dashboard');
        // Login automático via localStorage se o teste anterior rodou no mesmo contexto 
        // (Playwright usually resets context, so we might need to login again or use storageState)

        await page.click('text=Veículos');
        await expect(page).toHaveURL(/.*vehicles/);

        // Clica em "Novo Veículo" (baseado no Floating Action Button do Dashboard ou lista)
        const newBtn = page.getByRole('button', { name: /novo veículo/i }).first();
        if (await newBtn.isVisible()) {
            await newBtn.click();
            await expect(page.locator('text=Novo Veículo')).toBeVisible();
        }
    });

    test('deve verificar se as configurações de Branding estão acessíveis', async ({ page }) => {
        await page.goto('/dashboard');
        // Simula clique no avatar ou navegação direta
        await page.goto('/settings');

        await page.click('text=Organização');

        // Verifica elementos do novo formulário que criei
        await expect(page.getByText(/Salvar Alterações/i)).toBeVisible();
        await expect(page.getByPlaceholder(/Nome Corporativo/i)).toBeVisible();
    });
});
