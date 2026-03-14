import { test, expect } from '@playwright/test';

test.describe('Fluxo Completo de Jornada', () => {
    test.setTimeout(60000);
    const TEST_PLATE = `E2E${Math.floor(Math.random() * 10000)}`;

    test('deve realizar o ciclo de vida completo de uma jornada', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.getByPlaceholder('Email corporativo').fill('admin@frota2026.com.br');
        await page.getByPlaceholder('Sua senha').fill('123456');
        await page.getByRole('button', { name: /entrar/i }).click();
        await expect(page).toHaveURL(/.*dashboard/);

        // 2. Criar Veículo para o Teste
        await page.goto('/vehicles');
        await page.getByRole('button', { name: /adicionar veículo/i }).click();
        await page.getByLabel('Placa').fill(TEST_PLATE);
        await page.getByLabel('Modelo').fill('E2E Test Car');
        await page.getByLabel('Marca').fill('Playwright');
        await page.getByLabel('Ano').fill('2024');
        await page.getByLabel('KM Inicial').fill('1000');
        await page.getByRole('button', { name: /salvar/i }).click();

        // 3. Buscar o Veículo e Iniciar Jornada
        await page.getByPlaceholder('Buscar por placa').fill(TEST_PLATE);
        const vehicleCard = page.locator(`text=${TEST_PLATE}`).locator('xpath=..');
        await expect(vehicleCard).toBeVisible();
        
        await vehicleCard.getByRole('button', { name: /iniciar jornada/i }).click();
        
        // Modal Step 1
        await page.getByPlaceholder('Para onde vamos?').fill('São Paulo');
        await page.locator('button:has-text("São Paulo")').first().click();
        
        // Wait for OSRM estimate to appear
        await expect(page.getByText(/Rota Planejada com Sucesso/i)).toBeVisible();
        await page.getByRole('button', { name: /verificar veículo/i }).click();
        
        // Modal Step 2 (Checklist)
        await page.getByRole('button', { name: /iniciar jornada/i }).click();
        
        // 4. Verificar se a jornada aparece na lista
        await page.goto('/journeys');
        await page.getByPlaceholder('Buscar por veículo').fill(TEST_PLATE);
        await expect(page.locator(`text=${TEST_PLATE}`)).toBeVisible();
        await expect(page.getByText('Em Jornada')).toBeVisible();

        // 5. Finalizar Jornada
        await page.getByRole('button', { name: /finalizar jornada/i }).click();
        
        // Modal Step 1: KM Final
        await page.locator('input[type="number"]').fill('1150'); // 150km percored
        await page.getByRole('button', { name: /verificar retorno/i }).click();
        
        // Modal Step 2: Checklist
        await page.getByRole('button', { name: /próximo: assinatura/i }).click();
        
        // Modal Step 3: Assinatura
        await page.getByText(/clique para assinar/i).click();
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        if (box) {
            await page.mouse.move(box.x + 10, box.y + 10);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10);
            await page.mouse.up();
        }
        await page.getByRole('button', { name: /confirmar assinatura/i }).click();
        await page.getByRole('button', { name: /encerrar jornada/i }).click();

        // 6. Verificar Resultado Final
        await expect(page.getByText('Finalizada')).toBeVisible();
        await expect(page.getByText('150,0 KM')).toBeVisible();
    });
});
