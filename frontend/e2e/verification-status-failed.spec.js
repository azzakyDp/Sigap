import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test.describe('Verification Point 5 - Status FAILED Manual Verification Check', () => {

  test('When AI analysis status is FAILED, manual verification button remains 100% functional', async ({ page, request }) => {
    // 1. Create a pending report
    const citizen = generateCitizenData();
    const reg = await registerCitizenApi(request, citizen);
    const catRes = await request.get(`${API_BASE_URL}/categories`);
    const categories = await catRes.json();

    const reportRes = await request.post(`${API_BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${reg.access_token}` },
      multipart: {
        category_id: String(categories[0]?.id || 1),
        deskripsi: 'Laporan pengujian verifikasi manual saat AI status FAILED.',
        waktu_kejadian: new Date().toISOString(),
        latitude: -7.12,
        longitude: 112.38,
        alamat_lokasi: 'Jl. Failed Status Test No. 55',
        dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
        files: {
          name: 'photo.png',
          mimeType: 'image/png',
          buffer: dummyBuffer,
        },
      },
    });
    const reportData = await reportRes.json();

    // 2. Mock AI Analysis endpoint to force status FAILED
    await page.route(`**/api/v1/reports/${reportData.id}/ai-analysis`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 888,
          report_id: reportData.id,
          status: 'FAILED',
          summary: null,
          created_at: new Date().toISOString(),
        }),
      });
    });

    // 3. Login as verifier
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    // 4. Open report detail page
    await page.goto(`/verifier/reports/${reportData.id}`);
    await page.waitForLoadState('networkidle');

    // Confirm AI panel displays failed notice & retry button
    const failedNotice = page.locator('text=Analisis AI belum tersedia untuk laporan ini');
    await expect(failedNotice).toBeVisible({ timeout: 10000 });

    const retryBtn = page.getByRole('button', { name: 'Coba lagi', exact: true });
    await expect(retryBtn).toBeVisible();

    // 5. Confirm "Verifikasi" button is enabled and fully functional
    const verifyBtn = page.getByRole('button', { name: 'Verifikasi', exact: true });
    await expect(verifyBtn).toBeVisible();
    expect(await verifyBtn.isEnabled()).toBeTruthy();

    // 6. Open modal & submit manual verification
    await verifyBtn.click();
    const modalHeader = page.locator('h3', { hasText: 'Verifikasi Laporan' });
    await expect(modalHeader).toBeVisible();

    // Submit verification
    const submitModalBtn = page.getByRole('button', { name: 'Setujui Verifikasi' });
    await submitModalBtn.click();

    // Modal closes and status badge updates to VERIFIED
    await expect(modalHeader).not.toBeVisible({ timeout: 10000 });

    // Verify DB status changed to VERIFIED
    const checkReportRes = await request.get(`${API_BASE_URL}/reports/${reportData.id}`, {
      headers: { Authorization: `Bearer ${reg.access_token}` },
    });
    const updatedReport = await checkReportRes.json();
    console.log(`[VERIFIED REPORT STATUS]: ${updatedReport.status_raw}`);
    expect(updatedReport.status_raw).toBe('VERIFIED');
  });

});
