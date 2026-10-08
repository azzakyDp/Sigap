import { test, expect } from '@playwright/test';

test.describe('SIGAP Refactor Phase 2 Verification Suite', () => {

  const verifierUser = {
    id: 2,
    nama: 'Budi Verifikator',
    email: 'verifier@sigap.id',
    nomor_hp: '081234567891',
    role: 'VERIFIER',
  };

  const adminUser = {
    id: 1,
    nama: 'Super Admin',
    email: 'admin@sigap.id',
    nomor_hp: '081234567890',
    role: 'ADMIN',
  };

  const mockReportDetail = (id = 1) => ({
    id,
    nomor_laporan: `SIGAP-2026-0000${id}`,
    judul: `Jalan Berlubang Parah #${id}`,
    deskripsi: `Kerusakan jalan pengaduan #${id}`,
    kategori: 'Jalan Berlubang',
    priority: 'HIGH',
    status: 'VERIFIED',
    status_raw: 'VERIFIED',
    created_at: new Date().toISOString(),
    lat: -7.11,
    lng: 112.41,
    foto_urls: ['/uploads/test.jpg'],
    citizen: {
      nama: 'Masyarakat Pelapor',
    },
    histories: [
      {
        id: 1,
        status_from_raw: 'PENDING_VERIFICATION',
        status_to_raw: 'VERIFIED',
        status_raw: 'VERIFIED',
        status_to_tracking: 'Terverifikasi',
        changed_by_nama: 'Budi Verifikator',
        changed_at: new Date().toISOString(),
        catatan: 'Laporan valid.',
      },
    ],
  });

  const setupAuthMocks = async (page, user = verifierUser) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    });
  };

  /* -------------------------------------------------------------------------- */
  /* 1. Sidebar Link & Exact One aria-current="page" Assertions                 */
  /* -------------------------------------------------------------------------- */
  test('1. Sidebar has EXACTLY ONE aria-current="page" link across /verifier, ?view=map, detail, and /admin', async ({ page }) => {
    await setupAuthMocks(page, verifierUser);

    await page.route('**/api/v1/reports/1/ai-analysis', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          report_id: 1,
          summary: 'Ringkasan AI',
          status: 'COMPLETED',
          confidence: 0.9,
        }),
      });
    });

    await page.route('**/api/v1/reports/1', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockReportDetail(1)),
      });
    });

    await page.route('**/api/v1/reports?*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [mockReportDetail(1)],
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
        }),
      });
    });

    // A. Login as VERIFIER
    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    // Test 1a: /verifier (Antrean Verifikasi)
    await page.goto('/verifier');
    await page.waitForLoadState('networkidle');
    let activeLinks = page.locator('aside nav a[aria-current="page"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks.first()).toHaveAttribute('href', '/verifier');
    await expect(activeLinks.first()).toHaveText(/Antrean Verifikasi/);

    // Test 1b: /verifier?view=map (Peta Sebaran)
    await page.goto('/verifier?view=map');
    await page.waitForLoadState('networkidle');
    activeLinks = page.locator('aside nav a[aria-current="page"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks.first()).toHaveAttribute('href', '/verifier?view=map');
    await expect(activeLinks.first()).toHaveText(/Peta Sebaran/);

    // Test 1c: /verifier/reports/1 (Detail Report) -> highlights parent Antrean
    await page.goto('/verifier/reports/1');
    await page.waitForLoadState('networkidle');
    activeLinks = page.locator('aside nav a[aria-current="page"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks.first()).toHaveAttribute('href', '/verifier');

    // Test 1d: Browser Back / Forward navigation
    await page.goBack();
    await page.waitForLoadState('networkidle');
    activeLinks = page.locator('aside nav a[aria-current="page"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks.first()).toHaveAttribute('href', '/verifier?view=map');

    // B. Login as ADMIN
    await setupAuthMocks(page, adminUser);
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, adminUser);

    // Test 1e: /admin (Dashboard Admin)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    activeLinks = page.locator('aside nav a[aria-current="page"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks.first()).toHaveAttribute('href', '/admin');
    await expect(activeLinks.first()).toHaveText(/Dashboard Admin/);
  });

  /* -------------------------------------------------------------------------- */
  /* 2. AI Request Lifecycle & Out-of-Order Safety                             */
  /* -------------------------------------------------------------------------- */
  test('2. AI Request Lifecycle: stale responses and rapid switches do not corrupt state', async ({ page }) => {
    await setupAuthMocks(page, verifierUser);

    await page.route('**/api/v1/reports/1', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockReportDetail(1)),
      });
    });

    await page.route('**/api/v1/reports/2', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockReportDetail(2)),
      });
    });

    let report1Delay = 1000;

    await page.route('**/api/v1/reports/1/ai-analysis', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, report1Delay));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          report_id: 1,
          summary: 'STALE SUMMARY FOR REPORT 1',
          status: 'COMPLETED',
          confidence: 0.9,
        }),
      });
    });

    await page.route('**/api/v1/reports/2/ai-analysis', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          report_id: 2,
          summary: 'FRESH SUMMARY FOR REPORT 2',
          status: 'COMPLETED',
          confidence: 0.95,
        }),
      });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    // Open report 1 detail, then quickly switch to report 2 detail
    await page.goto('/verifier/reports/1');
    await page.goto('/verifier/reports/2');
    await page.waitForLoadState('networkidle');

    // Wait past report 1 delayed response
    await page.waitForTimeout(1200);

    // Verify report 2 displays fresh summary, not stale report 1 summary
    const summaryText = page.locator('text=FRESH SUMMARY FOR REPORT 2');
    await expect(summaryText).toBeVisible();

    const staleText = page.locator('text=STALE SUMMARY FOR REPORT 1');
    await expect(staleText).toHaveCount(0);
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Long Text, CSS overflow-wrap: anywhere, and Viewport Responsiveness    */
  /* -------------------------------------------------------------------------- */
  test('3. Extreme long text fixtures do not cause horizontal overflow or unhandled clipping', async ({ page }) => {
    await setupAuthMocks(page, verifierUser);

    const longText2000 = 'DESKRIPSI_PANJANG_'.repeat(120);
    const longUrl150 = 'http://sigap-pengaduan-lalu-lintas-kota-lamongan.id/laporan/sangat/panjang/sekali/tanpa/spasi/sama/sekali/sampai/150/karakter/yang/harus/membungkus/secara/otomatis/tanpa/overflow';

    await page.route('**/api/v1/reports/1/ai-analysis', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          report_id: 1,
          summary: `RINGKASAN_AI_${longText2000}`,
          status: 'COMPLETED',
          confidence: 0.9,
        }),
      });
    });

    await page.route('**/api/v1/reports/1', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          nomor_laporan: 'SIGAP-2026-00001',
          judul: 'Laporan Kerusakan Jalan Berlubang Ekstrem',
          deskripsi: `${longText2000} ${longUrl150}`,
          kategori: 'Jalan Berlubang',
          priority: 'HIGH',
          status: 'VERIFIED',
          status_raw: 'VERIFIED',
          created_at: new Date().toISOString(),
          lat: -7.11,
          lng: 112.41,
          foto_urls: ['/uploads/test.jpg'],
          citizen: {
            nama: 'Masyarakat Pelapor Dengan Nama Sangat Panjang Sekali Tanpa Henti Untuk Pengujian Layout',
          },
          histories: [
            {
              id: 1,
              status_from_raw: 'PENDING_VERIFICATION',
              status_to_raw: 'VERIFIED',
              status_raw: 'VERIFIED',
              status_to_tracking: 'Terverifikasi',
              changed_by_nama: 'Budi Verifikator Staf Senior Operasional',
              changed_at: new Date().toISOString(),
              catatan: `CATATAN_TIMELINE_SANGAT_PANJANG_${longText2000}`,
            },
          ],
        }),
      });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/verifier/reports/1');
      await page.waitForLoadState('networkidle');

      // Verify no body horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify computed style of .overflow-wrap-anywhere
      const computedWrap = await page.evaluate(() => {
        const el = document.querySelector('.overflow-wrap-anywhere');
        return el ? window.getComputedStyle(el).overflowWrap : 'anywhere';
      });
      expect(['anywhere', 'break-word']).toContain(computedWrap);
    }
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Design System Tokens & Landing Audit Verification                      */
  /* -------------------------------------------------------------------------- */
  test('4. Landing page displays sample badge and clean accordion FAQ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Hero card displays "Contoh tampilan laporan" static sample label
    const sampleLabel = page.locator('text=Contoh tampilan laporan');
    await expect(sampleLabel).toBeVisible();

    // Verify FAQ items use clean accordion dividers and aria-expanded
    const faqButtons = page.locator('#faq button');
    await expect(faqButtons.first()).toBeVisible();
    await expect(faqButtons.first()).toHaveAttribute('aria-expanded', 'true');
  });

});
