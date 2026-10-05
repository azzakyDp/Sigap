import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, loginApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function createCitizenReportApi(request) {
  const citizen = generateCitizenData();
  const reg = await registerCitizenApi(request, citizen);
  
  const catRes = await request.get(`${API_BASE_URL}/categories`);
  const categories = await catRes.json();
  const categoryId = categories[0]?.id || 1;

  const res = await request.post(`${API_BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${reg.access_token}` },
    multipart: {
      category_id: String(categoryId),
      deskripsi: 'Laporan warga untuk pengujian verifikasi dan penugasan verifikator.',
      waktu_kejadian: new Date().toISOString(),
      latitude: -6.9175,
      longitude: 107.6191,
      alamat_lokasi: 'Jl. Pemuda No. 88, Lamongan',
      dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
      files: {
        name: 'evidence.png',
        mimeType: 'image/png',
        buffer: dummyBuffer,
      },
    },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create report: ${res.status()} ${await res.text()}`);
  }
  return await res.json();
}

test.describe('Phase 4 - Verifier Queue & Actions E2E Tests', () => {

  test('1. Verifier verifies report to VERIFIED & assigns to officer1 -> shifts queue tabs', async ({ page, request }) => {
    // 1. Create a pending report as citizen
    const report = await createCitizenReportApi(request);
    const nomorLaporan = report.nomor_laporan;

    // 2. Login as verifier1 via UI
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    // 3. Open detail of the created report from queue table
    const row = page.locator('tr', { hasText: nomorLaporan }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button').first().click();
    await page.waitForURL('**/verifier/reports/*');

    // Click Verifikasi action button
    const verifyBtn = page.getByRole('button', { name: 'Verifikasi', exact: true });
    await expect(verifyBtn).toBeVisible({ timeout: 15000 });
    await verifyBtn.click();

    // Select VERIFIED decision in modal
    const modal = page.locator('div.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Select VERIFIED button inside decision grid
    await modal.locator('button:has-text("VERIFIED")').click();

    // Fill verification note
    await modal.locator('textarea').fill('Laporan valid dan layak ditindaklanjuti');
    await modal.locator('button[type="submit"]:has-text("Setujui Verifikasi")').click();

    // Assert status updated to VERIFIED / Terverifikasi
    await expect(page.locator('text=Terverifikasi').first()).toBeVisible({ timeout: 15000 });

    // Now click Assign Officer
    const assignBtn = page.getByRole('button', { name: 'Tugaskan', exact: true });
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    const assignModal = page.locator('div.fixed.inset-0');
    await expect(assignModal).toBeVisible();

    // Select officer1 from select dropdown
    const officerSelect = assignModal.locator('select');
    await officerSelect.waitFor({ state: 'visible' });
    await officerSelect.selectOption({ label: 'Petugas Satu (officer1@sigap.test)' });
    await assignModal.locator('textarea').fill('Segera cek lokasi kejadian');
    await assignModal.locator('button[type="submit"]:has-text("Tugaskan Petugas")').click();

    // Assert status changes to Ditugaskan
    await expect(page.locator('text=Ditugaskan').first()).toBeVisible({ timeout: 15000 });
  });

  test('2. DUPLICATE decision without duplicate reference ID is rejected', async ({ page, request }) => {
    const report = await createCitizenReportApi(request);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    const row = page.locator('tr', { hasText: report.nomor_laporan }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button').first().click();
    await page.waitForURL('**/verifier/reports/*');

    const verifyBtn = page.getByRole('button', { name: 'Verifikasi', exact: true });
    await expect(verifyBtn).toBeVisible({ timeout: 15000 });
    await verifyBtn.click();

    const modal = page.locator('div.fixed.inset-0');
    await expect(modal).toBeVisible();
    await modal.locator('button:has-text("DUPLICATE")').click();

    // Fill catatan so !catatan.trim() passes, but leave duplicate_of_report_id empty
    await modal.locator('textarea').fill('Catatan duplikat pengujian');
    await modal.locator('button[type="submit"]:has-text("Tandai Duplikat")').click();

    // Custom validation error should appear in modal
    const errText = modal.locator('text=ID laporan rujukan wajib').first();
    await expect(errText).toBeVisible({ timeout: 5000 });
  });

  test('3. REJECTED decision without verification note is rejected', async ({ page, request }) => {
    const report = await createCitizenReportApi(request);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    const row = page.locator('tr', { hasText: report.nomor_laporan }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button').first().click();
    await page.waitForURL('**/verifier/reports/*');

    const verifyBtn = page.getByRole('button', { name: 'Verifikasi', exact: true });
    await expect(verifyBtn).toBeVisible({ timeout: 15000 });
    await verifyBtn.click();

    const modal = page.locator('div.fixed.inset-0');
    await expect(modal).toBeVisible();
    await modal.locator('button:has-text("REJECTED")').click();

    // Leave textarea note empty and click submit
    await modal.locator('button[type="submit"]:has-text("Tolak Laporan")').click();

    // Validation error should appear
    const errText = modal.locator('text=Catatan wajib diisi').first();
    await expect(errText).toBeVisible({ timeout: 5000 });
  });

});
