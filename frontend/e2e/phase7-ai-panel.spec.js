import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, loginApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function createPendingReport(request) {
  const citizen = generateCitizenData();
  const reg = await registerCitizenApi(request, citizen);
  const catRes = await request.get(`${API_BASE_URL}/categories`);
  const categories = await catRes.json();

  const res = await request.post(`${API_BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${reg.access_token}` },
    multipart: {
      category_id: String(categories[0]?.id || 1),
      deskripsi: 'Laporan untuk pengujian AI Panel dan otorisasi UI Verifikator vs Citizen.',
      waktu_kejadian: new Date().toISOString(),
      latitude: -6.9175,
      longitude: 107.6191,
      alamat_lokasi: 'Jl. Pemuda No. 77, Lamongan',
      dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
      files: {
        name: 'photo.png',
        mimeType: 'image/png',
        buffer: dummyBuffer,
      },
    },
  });
  return { report: await res.json(), citizen, citizenToken: reg.access_token };
}

test.describe('Phase 7 - AI Integration & UI Polish E2E Tests', () => {

  test('1. Verifier opens detail -> "Verifikasi" button remains enabled regardless of AI panel state', async ({ page, request }) => {
    const { report } = await createPendingReport(request);

    // Login as verifier1 via UI
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    const row = page.locator('tr', { hasText: report.nomor_laporan }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: 'Detail' }).click();
    await page.waitForURL('**/verifier/reports/*');

    // AI Panel is present in staff view
    const aiPanelHeader = page.locator('text=Rekomendasi AI — bukan keputusan final').or(page.locator('text=Analisis AI')).first();
    await expect(aiPanelHeader).toBeVisible({ timeout: 15000 });

    // Verification button is visible and enabled
    const verifyBtn = page.getByRole('button', { name: 'Verifikasi', exact: true });
    await expect(verifyBtn).toBeVisible({ timeout: 15000 });
    expect(await verifyBtn.isEnabled()).toBeTruthy();

    // Clicking verification button opens modal
    await verifyBtn.click();
    const modal = page.locator('[role="dialog"], .bg-surface').filter({ hasText: 'Verifikasi Laporan' });
    await expect(modal).toBeVisible();
  });

  test('2. Citizen opens report detail -> AI Panel is NOT rendered in citizen view', async ({ page, request }) => {
    const { report, citizen } = await createPendingReport(request);

    // Login as citizen
    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Open report detail as citizen
    await page.goto('/reports/me');
    await page.waitForLoadState('networkidle');

    const reportRow = page.locator(`text=${report.nomor_laporan}`).first();
    await expect(reportRow).toBeVisible({ timeout: 10000 });
    await reportRow.click();
    await page.waitForURL('**/reports/*');

    // Assert AI Panel is NOT rendered for citizen
    const aiPanel = page.locator('text=Rekomendasi AI — bukan keputusan final');
    await expect(aiPanel).not.toBeVisible();
  });

});
