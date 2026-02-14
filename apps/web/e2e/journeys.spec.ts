import { test, expect } from '@playwright/test';

// Mock data
const mockStats = {
    stats: {
        activeJourneys: 2,
        availableVehicles: 5,
        monthlyCosts: 1250,
        totalKm: 3400
    },
    history: []
};

const mockJourneys = [
    {
        id: 'journey-123',
        drivierId: 'driver-1',
        vehicleId: 'vehicle-1',
        status: 'IN_PROGRESS',
        startTime: new Date().toISOString(),
        startKm: 10000,
        vehicle: { plate: 'ABC-1234', model: 'Fiat Uno' },
        driver: { name: 'João Silva' },
        checklists: [{ id: 'cl-1', type: 'CHECKOUT', items: [] }]
    }
];

const mockJourneyDetails = {
    ...mockJourneys[0],
    checklists: [
        {
            id: 'cl-1',
            type: 'CHECKOUT',
            createdAt: new Date().toISOString(),
            items: [
                { itemId: 'tires', status: 'OK', photoUrl: 'https://via.placeholder.com/150' },
                { itemId: 'lights', status: 'PROBLEM', notes: 'Broken', photoUrl: 'https://via.placeholder.com/150' }
            ]
        }
    ]
};

test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('*/**/auth/login', async route => {
        await route.fulfill({ json: { access_token: 'fake-token' } });
    });

    await page.route('*/**/reports/overview', async route => {
        await route.fulfill({ json: mockStats });
    });

    await page.route('*/**/journeys', async route => {
        await route.fulfill({ json: mockJourneys });
    });

    await page.route('*/**/journeys/journey-123', async route => {
        await route.fulfill({ json: mockJourneyDetails });
    });

    // Mock authentication state
    await page.addInitScript(() => {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('user', JSON.stringify({ name: 'Admin', email: 'admin@test.com' }));
    });
});

test('dashboard loads and displays stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Painel de Controle')).toBeVisible();
    await expect(page.getByText('Jornadas Ativas')).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible(); // from mockStats
});

test('journeys list displays mocked journey', async ({ page }) => {
    await page.goto('/journeys');
    await expect(page.getByText('Fiat Uno')).toBeVisible();
    await expect(page.getByText('ABC-1234')).toBeVisible();
    await expect(page.getByText('João Silva')).toBeVisible();
});

test('can navigate to journey details and see photos', async ({ page }) => {
    await page.goto('/journeys');

    // Click details button (assuming navigation works)
    await page.getByRole('button', { name: /Ver Detalhes/i }).click();

    // Verify URL
    await expect(page).toHaveURL(/\/journeys\/journey-123/);

    // Verify Details Page content
    await expect(page.getByText('Detalhes da Jornada')).toBeVisible();
    await expect(page.getByText('Check-out')).toBeVisible();

    // Verify Gallery images (placeholder)
    // We look for the images in the DOM
    const images = page.locator('img[src^="https://via.placeholder.com"]');
    await expect(images).toHaveCount(2);
});
