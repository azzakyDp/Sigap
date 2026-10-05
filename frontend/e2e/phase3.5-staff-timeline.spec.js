import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, loginApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test.describe('Phase 3.5 - Staff Timeline Privacy & Labeling E2E Tests', () => {

  test('15-18. Citizen report -> Verifier verify & assign -> Citizen views timeline (clean citizen labels, no raw codes/staff names)', async ({ page, request }) => {
    // 15. Create report as Citizen
    const citizen = generateCitizenData();
    const regRes = await registerCitizenApi(request, citizen);
    const citizenToken = regRes.access_token;

    const catRes = await request.get(`${API_BASE_URL}/categories`);
    const categories = await catRes.json();
    const categoryId = categories[0]?.id || 1;

    const createReportRes = await request.post(`${API_BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
      multipart: {
        category_id: String(categoryId),
        deskripsi: 'Laporan pengaduan untuk pengujian kerahasiaan nama staf dan label timeline citizen.',
        waktu_kejadian: new Date().toISOString(),
        latitude: -6.9175,
        longitude: 107.6191,
        alamat_lokasi: 'Jl. Pemuda No. 100, Lamongan',
        dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
        files: {
          name: 'photo.png',
          mimeType: 'image/png',
          buffer: dummyBuffer,
        },
      },
    });
    if (!createReportRes.ok()) {
      throw new Error(`Failed to create report for test: ${createReportRes.status()} ${await createReportRes.text()}`);
    }
    const report = await createReportRes.json();
    const reportId = report.id;

    // 16. Login as verifier via API request context and verify report
    const verifierLogin = await loginApi(request, 'verifier1@sigap.test', 'Verifier123!');
    const verifierToken = verifierLogin.access_token;

    const verifyRes = await request.patch(`${API_BASE_URL}/reports/${reportId}/verify`, {
      headers: { Authorization: `Bearer ${verifierToken}` },
      data: {
        decision: 'VERIFIED',
        catatan: 'Verifikasi kelayakan via E2E test',
      },
    });
    if (!verifyRes.ok()) {
      throw new Error(`Failed to verify report: ${verifyRes.status()} ${await verifyRes.text()}`);
    }

    // 17. Get officers and assign report to officer1 via API request context
    const officersRes = await request.get(`${API_BASE_URL}/officers`, {
      headers: { Authorization: `Bearer ${verifierToken}` },
    });
    if (!officersRes.ok()) {
      throw new Error(`Failed to get officers: ${officersRes.status()} ${await officersRes.text()}`);
    }
    const officers = await officersRes.json();
    const officer1 = officers.find((o) => o.email === 'officer1@sigap.test') || officers[0];

    const assignRes = await request.post(`${API_BASE_URL}/reports/${reportId}/assign`, {
      headers: { Authorization: `Bearer ${verifierToken}` },
      data: {
        officer_id: officer1.id,
        catatan: 'Penugasan ke petugas via E2E test',
      },
    });
    if (!assignRes.ok()) {
      throw new Error(`Failed to assign report: ${assignRes.status()} ${await assignRes.text()}`);
    }

    // 18. Citizen logs in via browser and opens /reports/{reportId}
    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto(`/reports/${reportId}`);
    await page.waitForLoadState('networkidle');

    // Assert timeline element or concise status label "Diverifikasi" is present
    const timelineLabel = page.locator('text=Diverifikasi').first();
    await expect(timelineLabel).toBeVisible({ timeout: 10000 });

    const pageContent = await page.content();

    // Assert concise citizen label "Diverifikasi" is visible
    expect(pageContent).toContain('Diverifikasi');

    // Assert raw backend status codes (VERIFIED, ASSIGNED) are NOT displayed to citizen
    expect(pageContent).not.toContain('VERIFIED');
    expect(pageContent).not.toContain('ASSIGNED');

    // Assert staff name (Verifier Satu / Petugas Satu) is NOT displayed in citizen timeline
    expect(pageContent).not.toContain('Verifier Satu');
    expect(pageContent).not.toContain('Petugas Satu');
  });

});
