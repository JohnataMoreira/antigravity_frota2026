import { test, expect } from '@playwright/test';

test.describe('Navegação Logada', () => {
    // Usando beforeEach para abstrair um "mock" de login ou login via script antes do teste real
    // Mas no smoke test básico focado em rotas públicas ou login hardcoded:

    test('deve proteger rotas restritas quando não autenticado', async ({ page }) => {
        // Tenta acessar dashboard direto
        await page.goto('/dashboard');

        // Deve ser redirecionado para /login
        await expect(page).toHaveURL(/.*\/login/);
    });

    // Um teste mockando a sessão local storage para pular o login via web e ir direto às rotas
    test('deve acessar página principal (Dashboard) ao ter token válido', async ({ page }) => {
        await page.goto('/');

        // Injetando um localStorage falso
        await page.evaluate(() => {
            localStorage.setItem('token', 'fake-jwt-token-123');
            localStorage.setItem('user', JSON.stringify({
                id: '1',
                email: 'admin@frota2026.com',
                name: 'Admin Frota',
                role: 'ADMIN',
                organizationId: 'org1'
            }));
        });

        // E precisamos interceptar rotas de API para não cair por erro 401:
        await page.route('**/api/auth/me', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: '1',
                    email: 'admin@frota2026.com',
                    name: 'Admin Frota',
                    role: 'ADMIN',
                    organizationId: 'org1'
                })
            });
        });

        await page.route('**/api/reports/overview', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    stats: {
                        activeJourneys: 0,
                        availableVehicles: 5,
                        inUseVehicles: 0,
                        maintenanceVehicles: 0,
                    },
                    history: []
                })
            });
        });

        await page.goto('/dashboard');

        // A página deve não deslogar esse mock e exibir Bem Vindo
        await expect(page.getByText(/Bem-vindo ao Frota Manager/i)).toBeVisible();
    });
});
