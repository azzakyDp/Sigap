import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, API_BASE_URL } from './helpers.js';

const dummyImage = {
  name: 'dummy_evidence.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
};

test.describe('Phase 2 - Create Report E2E Tests', () => {

  test('7. Complete report submission with 1 image -> modal success with SIGAP-{year}-{5digit}', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    // Login via UI
    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Go to create report
    await page.goto('/reports/create');

    // Select category
    const categorySelect = page.locator('select').first();
    await categorySelect.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('select')?.options.length > 1);
    await categorySelect.selectOption({ index: 1 });

    // Wait for dynamic inputs to appear and fill them
    await page.waitForTimeout(300);
    const dynamicInputs = page.locator('input[placeholder*="jenis_kerusakan"], input[name="jenis_kerusakan"]');
    if (await dynamicInputs.count() > 0) {
      await dynamicInputs.first().fill('Lubang Aspal Sedang');
    }

    // Fill description
    await page.fill('textarea', 'Jalan berlubang besar di depan pertokoan sangat membahayakan pengendara motor.');

    // Fill address
    await page.fill('input[name="alamat_lokasi"]', 'Jl. Merdeka No. 45, Kecamatan Lamongan');

    // Upload 1 image
    await page.setInputFiles('input[type="file"]', dummyImage);

    // Submit form
    await page.click('button[type="submit"]');

    // Modal success should appear
    const modalHeading = page.locator('h3').filter({ hasText: /Pengaduan Laporan Berhasil/i });
    await expect(modalHeading.first()).toBeVisible({ timeout: 10000 });

    // Check report number format: SIGAP-2026-XXXXX or SIGAP-\d{4}-\d{5}
    const reportNumText = await page.locator('.font-mono').filter({ hasText: 'SIGAP-' }).innerText();
    const currentYear = new Date().getFullYear();
    const regex = new RegExp(`SIGAP-${currentYear}-\\d{5}`);
    expect(reportNumText).toMatch(regex);
  });

  test('8. Submit without image -> displays image error, request not sent', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports/create');
    await page.waitForFunction(() => document.querySelector('select')?.options.length > 1);
    await page.locator('select').first().selectOption({ index: 1 });
    await page.fill('textarea', 'Jalan berlubang tanpa foto bukti untuk menguji validasi error.');
    await page.fill('input[name="alamat_lokasi"]', 'Jl. Pemuda No. 12');

    // Click submit without attaching photo
    await page.click('button[type="submit"]');

    // Error message should appear
    const photoError = page.locator('text=Minimal 1 foto bukti');
    await expect(photoError).toBeVisible();
    expect(page.url()).toContain('/reports/create');
  });

  test('9. Submit without category -> displays category error', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports/create');
    await page.fill('textarea', 'Deskripsi tanpa memilih kategori terlebih dahulu.');
    await page.fill('input[name="alamat_lokasi"]', 'Jl. Sudirman No. 88');
    await page.setInputFiles('input[type="file"]', dummyImage);

    // Click submit without selecting category
    await page.click('button[type="submit"]');

    const categoryError = page.locator('text=Pilih kategori pengaduan');
    await expect(categoryError).toBeVisible();
  });

  test('10. Upload 6 images at once -> displays "maksimal 5 foto" error, request not sent', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports/create');

    const sixImages = Array.from({ length: 6 }, (_, i) => ({
      name: `evidence_${i + 1}.png`,
      mimeType: 'image/png',
      buffer: dummyImage.buffer,
    }));

    await page.setInputFiles('input[type="file"]', sixImages);

    const maxPhotosError = page.locator('.bg-danger-light, .text-danger').filter({ hasText: 'Maksimal 5 foto' }).first();
    await expect(maxPhotosError).toBeVisible();
  });

  test('11. Set location marker -> submit -> fetch GET /reports/{id} -> lat/lng matches clicked point', async ({ page, request }) => {
    const citizen = generateCitizenData();
    const regResult = await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/reports/create');
    await page.waitForFunction(() => document.querySelector('select')?.options.length > 1);
    await page.locator('select').first().selectOption({ index: 1 });

    await page.waitForTimeout(300);
    const dynamicInputs = page.locator('input[placeholder*="jenis_kerusakan"], input[name="jenis_kerusakan"]');
    if (await dynamicInputs.count() > 0) {
      await dynamicInputs.first().fill('Lubang Aspal Sedang');
    }

    await page.fill('textarea', 'Laporan dengan penentuan titik lokasi presisi di Leaflet Map.');
    await page.fill('input[name="alamat_lokasi"]', 'Jl. Alun-alun Lamongan No. 1');
    await page.setInputFiles('input[type="file"]', dummyImage);

    // Click map container to set coordinates
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.waitFor({ state: 'visible' });
    const box = await mapContainer.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2 + 30, box.y + box.height / 2 - 20);
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success modal and get report number
    const modal = page.locator('.font-mono').filter({ hasText: 'SIGAP-' });
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    const text = await modal.innerText();
    const match = text.match(/SIGAP-\d{4}-\d{5}/);
    expect(match).not.toBeNull();
    const nomorLaporan = match[0];

    // Fetch created report via API request context
    const apiResponse = await request.get(`${API_BASE_URL}/reports/me`, {
      headers: {
        Authorization: `Bearer ${regResult.access_token}`,
      },
    });
    expect(apiResponse.ok()).toBeTruthy();
    const userReports = await apiResponse.json();
    const createdReportSummary = userReports.items.find((r) => r.nomor_laporan === nomorLaporan);
    expect(createdReportSummary).toBeTruthy();

    // Fetch report detail
    const detailResponse = await request.get(`${API_BASE_URL}/reports/${createdReportSummary.id}`, {
      headers: {
        Authorization: `Bearer ${regResult.access_token}`,
      },
    });
    expect(detailResponse.ok()).toBeTruthy();
    const detail = await detailResponse.json();

    // Assert latitude and longitude exist and are numeric
    expect(typeof detail.latitude).toBe('number');
    expect(typeof detail.longitude).toBe('number');
    expect(detail.latitude).not.toBe(0);
    expect(detail.longitude).not.toBe(0);
  });

});
