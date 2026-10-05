import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test.describe('Verification Point 4 - Unmount During Polling Console Check', () => {

  test('Navigating away while AI panel is polling produces ZERO React unmounted state warnings', async ({ page, request }) => {
    // 1. Create a pending report
    const citizen = generateCitizenData();
    const reg = await registerCitizenApi(request, citizen);
    const catRes = await request.get(`${API_BASE_URL}/categories`);
    const categories = await catRes.json();

    const reportRes = await request.post(`${API_BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${reg.access_token}` },
      multipart: {
        category_id: String(categories[0]?.id || 1),
        deskripsi: 'Laporan pengujian unmount polling AI panel console check.',
        waktu_kejadian: new Date().toISOString(),
        latitude: -7.12,
        longitude: 112.38,
        alamat_lokasi: 'Jl. Unmount Test No. 10',
        dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
        files: {
          name: 'photo.png',
          mimeType: 'image/png',
          buffer: dummyBuffer,
        },
      },
    });
    const reportData = await reportRes.json();

    // 2. Track browser console logs & warnings
    const consoleLogs = [];
    const consoleWarnings = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });
      if (type === 'warning' || type === 'error' || text.includes('unmounted') || text.includes('React state update')) {
        consoleWarnings.push(text);
      }
    });

    // 3. Mock AI Analysis route to ALWAYS return PENDING so polling continues
    await page.route(`**/api/v1/reports/${reportData.id}/ai-analysis`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          report_id: reportData.id,
          status: 'PENDING',
          summary: null,
          created_at: new Date().toISOString(),
        }),
      });
    });

    // 4. Login as verifier
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    // 5. Open report detail page
    await page.goto(`/verifier/reports/${reportData.id}`);
    await page.waitForLoadState('networkidle');

    // Confirm polling indicator is visible
    const pollingMsg = page.locator('text=AI sedang menganalisis laporan ini...');
    await expect(pollingMsg).toBeVisible({ timeout: 10000 });

    // 6. UNMOUNT IMMEDIATELY: Click "Kembali ke Antrean Verifikasi"
    const backBtn = page.getByRole('button', { name: 'Kembali ke Antrean Verifikasi' });
    await backBtn.click();
    await page.waitForURL('**/verifier');

    // 7. Wait 5 seconds to give any background interval a chance to fire
    await page.waitForTimeout(5000);

    // Assert NO React unmounted component state update warning was logged
    const reactWarnings = consoleWarnings.filter(w =>
      w.toLowerCase().includes('unmounted') ||
      w.toLowerCase().includes('react state update') ||
      w.toLowerCase().includes('memory leak')
    );

    console.log(`[CONSOLE LOG COUNT]: ${consoleLogs.length}`);
    console.log(`[REACT UNMOUNT WARNINGS]:`, reactWarnings);

    expect(reactWarnings.length).toBe(0);
  });

});
