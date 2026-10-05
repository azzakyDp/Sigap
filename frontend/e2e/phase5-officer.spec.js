import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi, loginApi, API_BASE_URL } from './helpers.js';

const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function createAssignedReportApi(request, officerEmail = 'officer1@sigap.test') {
  // 1. Citizen creates report
  const citizen = generateCitizenData();
  const reg = await registerCitizenApi(request, citizen);
  const catRes = await request.get(`${API_BASE_URL}/categories`);
  const categories = await catRes.json();
  const categoryId = categories[0]?.id || 1;

  const createRes = await request.post(`${API_BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${reg.access_token}` },
    multipart: {
      category_id: String(categoryId),
      deskripsi: 'Laporan untuk pengujian penanganan petugas lapangan (Phase 5).',
      waktu_kejadian: new Date().toISOString(),
      latitude: -6.9175,
      longitude: 107.6191,
      alamat_lokasi: 'Jl. Pemuda No. 50, Lamongan',
      dynamic_fields: JSON.stringify({ jenis_kerusakan: 'Lubang Aspal Sedang' }),
      files: {
        name: 'photo.png',
        mimeType: 'image/png',
        buffer: dummyBuffer,
      },
    },
  });
  const report = await createRes.json();

  // 2. Verifier verifies
  const verifierLogin = await loginApi(request, 'verifier1@sigap.test', 'Verifier123!');
  await request.patch(`${API_BASE_URL}/reports/${report.id}/verify`, {
    headers: { Authorization: `Bearer ${verifierLogin.access_token}` },
    data: { decision: 'VERIFIED', catatan: 'Verified for officer test' },
  });

  // 3. Verifier assigns to target officer
  const officersRes = await request.get(`${API_BASE_URL}/officers`, {
    headers: { Authorization: `Bearer ${verifierLogin.access_token}` },
  });
  const officers = await officersRes.json();
  const officer = officers.find((o) => o.email === officerEmail) || officers[0];

  await request.post(`${API_BASE_URL}/reports/${report.id}/assign`, {
    headers: { Authorization: `Bearer ${verifierLogin.access_token}` },
    data: { officer_id: officer.id, catatan: 'Assignment for officer test' },
  });

  return { report, officer };
}

test.describe('Phase 5 - Officer Dashboard & Handling E2E Tests', () => {

  test('1. Officer1 starts handling -> logs 2 action reports -> resolves report (RESOLVED)', async ({ page, request }) => {
    const { report } = await createAssignedReportApi(request, 'officer1@sigap.test');

    // Login as officer1 via UI
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'officer1@sigap.test');
    await page.fill('input[name="password"]', 'Officer123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/officer');

    // Open detail of assigned report from table
    const row = page.locator('tr', { hasText: report.nomor_laporan }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: 'Detail' }).click();
    await page.waitForURL('**/officer/reports/*');

    // Click "Mulai Tangani" button
    const startBtn = page.getByRole('button', { name: 'Mulai Tangani', exact: true });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();
    await page.waitForLoadState('networkidle');

    // Assert status updated to IN_PROGRESS / Sedang Ditangani
    await expect(page.locator('text=Sedang Ditangani').first()).toBeVisible();

    // Log Action Report 1
    const logActionBtn = page.getByRole('button', { name: 'Catat Tindakan', exact: true });
    await expect(logActionBtn).toBeVisible();
    await logActionBtn.click();

    const actionModal = page.locator('[role="dialog"], .bg-surface').filter({ hasText: 'Catat Tindakan Lapangan' });
    await actionModal.locator('input[placeholder*="Barikade"]').fill('Pemeriksaan Lokasi & Pemasangan Rambu');
    await actionModal.locator('textarea[placeholder*="Jelaskan"]').fill('Petugas telah tiba di lokasi dan memasang rambu pengaman jalan.');
    await actionModal.locator('textarea[placeholder*="Contoh: Lokasi telah"]').fill('Area lokasi aman dan telah ditandai.');
    await actionModal.locator('button[type="submit"]:has-text("Simpan Tindakan")').click();
    await page.waitForLoadState('networkidle');

    // Assert Action Report 1 is rendered in history
    await expect(page.locator('text=Pemeriksaan Lokasi & Pemasangan Rambu').first()).toBeVisible();

    // Log Action Report 2
    await logActionBtn.click();
    await actionModal.locator('input[placeholder*="Barikade"]').fill('Pengaspalan Penambalan Lubang');
    await actionModal.locator('textarea[placeholder*="Jelaskan"]').fill('Penambalan hotmix pada permukaan jalan berlubang tuntas dikerjakan.');
    await actionModal.locator('textarea[placeholder*="Contoh: Lokasi telah"]').fill('Jalan rata dan layak dilalui kembali.');
    await actionModal.locator('button[type="submit"]:has-text("Simpan Tindakan")').click();
    await page.waitForLoadState('networkidle');

    // Assert Action Report 2 is rendered
    await expect(page.locator('text=Pengaspalan Penambalan Lubang').first()).toBeVisible();

    // Resolve Report (RESOLVED)
    const resolveBtn = page.locator('button:has-text("Selesaikan")').first();
    await expect(resolveBtn).toBeVisible();
    await resolveBtn.click();

    const resolveModal = page.locator('[role="dialog"], .bg-surface').filter({ hasText: 'Selesaikan Penanganan' });
    await resolveModal.locator('textarea').fill('Seluruh pekerjaan perbaikan di lokasi telah selesai 100%.');
    await resolveModal.locator('button[type="submit"]:has-text("Kirim Hasil Penanganan")').click();
    await page.waitForLoadState('networkidle');

    // Assert status updated to RESOLVED / Selesai
    await expect(page.locator('text=Selesai').first()).toBeVisible();
  });

  test('2. Officer2 opening report assigned to Officer1 -> Action buttons hidden (read-only)', async ({ page, request }) => {
    const { report } = await createAssignedReportApi(request, 'officer1@sigap.test');

    // Login as officer2 via UI
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'officer2@sigap.test');
    await page.fill('input[name="password"]', 'Officer123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/officer');

    // Open detail of report assigned to officer1 (via direct URL while React Auth state is active)
    await page.evaluate((id) => {
      window.location.hash = '';
      window.history.pushState({}, '', `/officer/reports/${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, report.id);
    await page.waitForLoadState('networkidle');

    // Action buttons ("Mulai Tangani", "Catat Tindakan", "Selesaikan") should NOT be visible for officer2
    await expect(page.locator('button:has-text("Mulai Tangani")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Catat Tindakan")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Selesaikan")')).not.toBeVisible();
  });

});
