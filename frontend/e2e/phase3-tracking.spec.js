import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function createSingleReportApi(request, token, categoryId = 1, i = 1) {
  const response = await request.post(`${API_BASE_URL}/reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    multipart: {
      category_id: String(categoryId),
      deskripsi: `Laporan pengaduan otomatis ke-${i} untuk pengujian pagination dan tracking.`,
      waktu_kejadian: new Date().toISOString(),
      latitude: -6.9175 + i * 0.001,
      longitude: 107.6191 + i * 0.001,
      alamat_lokasi: `Jl. Pengujian No. ${i}, Lamongan`,
      dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
      files: {
        name: `photo_${i}.png`,
        mimeType: 'image/png',
        buffer: dummyBuffer,
      },
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create report ${i} via API: ${response.status()} ${await response.text()}`);
  }
  return await response.json();
}

test.describe('Phase 3 - Citizen Tracking & Privacy E2E Tests', () => {

  test('12. Login as new citizen (0 reports) -> /reports/me displays empty state', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports/me');
    await page.waitForLoadState('networkidle');

    // Empty state heading should be visible
    const emptyStateHeading = page.locator('h3').filter({ hasText: 'Belum Ada Laporan Pengaduan' });
    await expect(emptyStateHeading).toBeVisible({ timeout: 10000 });
  });

  test('13. Create 11 reports via API -> /reports/me pagination controls work', async ({ page, request }) => {
    const citizen = generateCitizenData();
    const regResult = await registerCitizenApi(request, citizen);
    const token = regResult.access_token;

    // Fetch active categories to get a valid category_id
    const catRes = await request.get(`${API_BASE_URL}/categories`);
    const categories = await catRes.json();
    const categoryId = categories[0]?.id || 1;

    // Create 11 reports sequentially via API
    for (let i = 1; i <= 11; i++) {
      await createSingleReportApi(request, token, categoryId, i);
    }

    // Login via UI and open My Reports
    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports/me');
    await page.waitForLoadState('networkidle');

    // Check pagination controls exist
    const nextBtn = page.locator('button:has-text("Selanjutnya")').first();
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    expect(await nextBtn.isEnabled()).toBeTruthy();

    // Click Next Page
    await nextBtn.click();
    await page.waitForLoadState('networkidle');

    // Assert page 2 indicator (e.g. text containing 'Menampilkan 11' or page 2 button)
    const activePageIndicator = page.locator('text=Menampilkan 11').or(page.locator('button.bg-primary').filter({ hasText: '2' })).first();
    await expect(activePageIndicator).toBeVisible();
  });

  test('14. Citizen B attempts to access report ID of Citizen A -> "Laporan tidak ditemukan"', async ({ page, request }) => {
    // 1. Citizen A creates report
    const citizenA = generateCitizenData();
    const regA = await registerCitizenApi(request, citizenA);
    const catRes = await request.get(`${API_BASE_URL}/categories`);
    const categories = await catRes.json();
    const categoryId = categories[0]?.id || 1;

    const reportA = await createSingleReportApi(request, regA.access_token, categoryId, 1);
    const reportAId = reportA.id;

    // 2. Citizen B logs in
    const citizenB = generateCitizenData();
    await registerCitizenApi(request, citizenB);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizenB.email);
    await page.fill('input[name="password"]', citizenB.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 3. Citizen B attempts to open Citizen A's report URL
    await page.goto(`/reports/${reportAId}`);
    await page.waitForLoadState('networkidle');

    // Assert "Laporan Tidak Ditemukan" heading is displayed instead of Citizen A's data
    const notFoundHeading = page.locator('h2').filter({ hasText: 'Laporan Tidak Ditemukan' });
    await expect(notFoundHeading).toBeVisible({ timeout: 10000 });
  });

});
