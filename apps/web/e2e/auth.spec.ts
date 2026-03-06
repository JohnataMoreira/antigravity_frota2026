import { test, expect } from '@playwright/test';

test.describe('Autenticação e Login', () => {
    test('deve renderizar a página de login corretamente', async ({ page }) => {
        await page.goto('/login');

        // Verifica se os elementos essenciais estão na tela
        await expect(page.getByPlaceholder('Email corporativo')).toBeVisible();
        await expect(page.getByPlaceholder('Sua senha')).toBeVisible();
        await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    });

    test('deve exibir erro para credenciais inválidas', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder('Email corporativo').fill('usuario@errado.com');
        await page.getByPlaceholder('Sua senha').fill('senha123');
        await page.getByRole('button', { name: /entrar/i }).click();

        // Aguarda a toast de erro ou mensagem em tela
        await expect(page.getByText(/Credenciais inválidas/i).or(page.getByText(/Não foi possível fazer login/i))).toBeVisible();
    });
});
