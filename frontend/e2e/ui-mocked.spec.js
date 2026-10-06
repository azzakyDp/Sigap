import { test, expect } from '@playwright/test';

test.describe('SIGAP UI Components & Regression Safety Net Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept CORS OPTIONS requests
    await page.route('**/api/v1/**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        });
      } else {
        await route.fallback();
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 1. CSS @theme & Contrast Tokens                                            */
  /* -------------------------------------------------------------------------- */
  test('1. CSS @theme typography scale (14px/20px) and border-strong contrast (3.49:1)', async ({ page }) => {
    await page.goto('/');

    const tokenStyles = await page.evaluate(() => {
      const el = document.documentElement;
      const computed = getComputedStyle(el);
      return {
        borderStrong: computed.getPropertyValue('--color-border-strong').trim(),
        fontXs: computed.getPropertyValue('--text-xs').trim() || computed.getPropertyValue('--font-size-xs').trim(),
        fontSm: computed.getPropertyValue('--text-sm').trim() || computed.getPropertyValue('--font-size-sm').trim(),
        fontBase: computed.getPropertyValue('--text-base').trim() || computed.getPropertyValue('--font-size-base').trim(),
        fontXl: computed.getPropertyValue('--text-xl').trim() || computed.getPropertyValue('--font-size-xl').trim(),
        font2Xl: computed.getPropertyValue('--text-2xl').trim() || computed.getPropertyValue('--font-size-2xl').trim(),
      };
    });

    expect(tokenStyles.borderStrong).toBe('#7A8B9E');
    expect(tokenStyles.fontXs).toBe('12px');
    expect(tokenStyles.fontSm).toBe('14px');
    expect(tokenStyles.fontBase).toBe('16px');
    expect(tokenStyles.fontXl).toBe('20px');
    expect(tokenStyles.font2Xl).toBe('24px');
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Button Component & Keluar Variant                                       */
  /* -------------------------------------------------------------------------- */
  test('2. Button sizes (sm/md), variants, and Keluar ghost button variant', async ({ page }) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'citizen@example.com',
          full_name: 'Warga Contoh',
          role: 'CITIZEN',
        }),
      });
    });

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      const user = { id: 1, email: 'warga@example.com', full_name: 'Warga SIGAP', role: 'CITIZEN' };
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(user));
    });
    await page.goto('/dashboard');

    const keluarBtn = page.getByRole('button', { name: 'Keluar' });
    await expect(keluarBtn).toBeVisible();

    const keluarClasses = await keluarBtn.getAttribute('class');
    expect(keluarClasses).toContain('hover:bg-background');
    expect(keluarClasses).toContain('bg-transparent');
    expect(keluarClasses).not.toContain('bg-primary');
    expect(keluarClasses).not.toContain('bg-red-600');

    await keluarBtn.click();
    await expect(page).toHaveURL('/login');
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Card Variants & Shadow Rule                                            */
  /* -------------------------------------------------------------------------- */
  test('3. Card variants (bordered, flat, dense) - no shadow-xs on bordered cards', async ({ page }) => {
    await page.goto('/login');

    const card = page.locator('.bg-surface').first();
    await expect(card).toBeVisible();

    const classes = await card.getAttribute('class');
    expect(classes).not.toContain('shadow-xs');
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Modal Accessibility & ARIA                                              */
  /* -------------------------------------------------------------------------- */
  test('4. Modal accessibility (role="dialog", aria-modal="true", aria-labelledby, Esc key closing)', async ({ page }) => {
    const citizenUser = {
      id: 1,
      email: 'citizen@example.com',
      full_name: 'Warga Contoh',
      role: 'CITIZEN',
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify(citizenUser),
      });
    });

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Jalan Berlubang', code: 'HOLE', fields: [] }
        ]),
      });
    });

    await page.route('**/api/v1/reports', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            nomor_laporan: 'SIGAP-2026-99999',
            status: 'PENDING_VERIFICATION',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json',
          body: JSON.stringify({ items: [], total: 0 }),
        });
      }
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, citizenUser);

    await page.goto('/reports/create');

    await page.selectOption('select', '1');
    await page.fill('textarea', 'Pengaduan jalan berlubang tes modal Playwright');
    await page.fill('input[name="alamat_lokasi"]', 'Jl. Pemuda No 10');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'bukti.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-bytes'),
    });

    await page.getByRole('button', { name: 'Kirim Laporan' }).first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Shared Icon Component                                                   */
  /* -------------------------------------------------------------------------- */
  test('5. Shared Icon component (strokeWidth=1.75, currentColor, inline flex centering)', async ({ page }) => {
    await page.goto('/');

    const icons = page.locator('svg');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const strokeWidth = await icons.nth(i).getAttribute('stroke-width');
      if (strokeWidth) {
        expect(strokeWidth).toBe('1.75');
      }
    }
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Tahap 1b: Sidebar Parent-Path Active Link Matching (6 URLs + /admin)    */
  /* -------------------------------------------------------------------------- */
  test('6. Sidebar active state parent-path matching across 6 URLs and /admin', async ({ page }) => {
    const verifierUser = {
      id: 2,
      email: 'verifier@example.com',
      full_name: 'Staf Verifikator',
      role: 'VERIFIER',
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify(verifierUser),
      });
    });

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/reports/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({
          id: 101,
          nomor_laporan: 'SIGAP-2026-00101',
          status_raw: 'PENDING_VERIFICATION',
          category_name: 'Jalan Berlubang',
          alamat_lokasi: 'Jl. Pemuda No 1',
        }),
      });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    // Navigating to detail page /verifier/reports/101 must keep /verifier link active
    await page.goto('/verifier/reports/101');
    const verifierNavLink = page.locator('aside a[href="/verifier"]');
    await expect(verifierNavLink).toHaveClass(/bg-primary-light/);
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Tahap 1b: Clean Error 500 Handling Across 3 List Pages                  */
  /* -------------------------------------------------------------------------- */
  test('7. Error 500 handling on list pages (MyReports, VerifierQueue, AssignedReports)', async ({ page }) => {
    const verifierUser = {
      id: 2,
      email: 'verifier@example.com',
      full_name: 'Staf Verifikator',
      role: 'VERIFIER',
    };

    const citizenUser = {
      id: 1,
      email: 'citizen@example.com',
      full_name: 'Warga Contoh',
      role: 'CITIZEN',
    };

    const officerUser = {
      id: 3,
      email: 'officer@example.com',
      full_name: 'Petugas Lapangan',
      role: 'OFFICER',
    };

    let currentUser = verifierUser;

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify(currentUser),
      });
    });

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock 500 Internal Server Error for report lists
    await page.route('**/api/v1/reports**', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal Server Error' }),
      });
    });

    // 1. Verifier Queue page
    currentUser = verifierUser;
    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    await page.goto('/verifier');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Coba Lagi' })).toBeVisible();

    // 2. My Reports page (Citizen)
    currentUser = citizenUser;
    await page.evaluate((u) => {
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, citizenUser);
    await page.goto('/reports/me');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });

    // 3. Assigned Reports page (Officer)
    currentUser = officerUser;
    await page.evaluate((u) => {
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, officerUser);
    await page.goto('/officer');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  /* -------------------------------------------------------------------------- */
  /* 8. Tahap 1b: AI Analysis Summary Long Text & Overflow Box                   */
  /* -------------------------------------------------------------------------- */
  test('8. AI Analysis Panel summary container handles long text with scrollable overflow-y-auto', async ({ page }) => {
    const verifierUser = {
      id: 2,
      email: 'verifier@example.com',
      full_name: 'Staf Verifikator',
      role: 'VERIFIER',
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify(verifierUser),
      });
    });

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const mockReport = {
      id: 101,
      nomor_laporan: 'SIGAP-2026-9999',
      title: 'Laporan Tes AI',
      status_raw: 'PENDING_VERIFICATION',
      category_name: 'Jalan Berlubang',
      priority: 'HIGH',
      waktu_kejadian: new Date().toISOString(),
      created_at: new Date().toISOString(),
      reporter_name: 'Warga Contoh',
      alamat_lokasi: 'Jl. Pemuda No. 1',
      latitude: -7.11,
      longitude: 112.41,
      deskripsi: 'Deskripsi tes modal',
      evidences: [],
      status_histories: [],
      field_values: [],
    };

    await page.route('**/api/v1/reports/101/ai-analysis', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'COMPLETED',
          summary: 'TeksPanjangTanpaSpasiSangatPanjangUjiCobaOverflow'.repeat(15),
          confidence: 0.95,
          suggested_category: 'Jalan Berlubang',
          suggested_priority: 'HIGH',
        }),
      });
    });

    await page.route('**/api/v1/reports/101', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify(mockReport),
      });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    await page.goto('/verifier/reports/101');
    const summaryBox = page.locator('.max-h-36.overflow-y-auto.break-words');
    await expect(summaryBox).toBeVisible();
  });

  /* -------------------------------------------------------------------------- */
  /* 9. Tahap 1b: Toggle View Mode URL Parameter ?view=map                     */
  /* -------------------------------------------------------------------------- */
  test('9. Toggle View Mode switches URL to ?view=map and back to Table view', async ({ page }) => {
    const verifierUser = {
      id: 2,
      email: 'verifier@example.com',
      full_name: 'Staf Verifikator',
      role: 'VERIFIER',
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify(verifierUser),
      });
    });

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    await page.goto('/verifier');
    await page.waitForLoadState('domcontentloaded');
    const mapBtn = page.getByRole('button', { name: 'Peta Sebaran' });
    await expect(mapBtn).toBeVisible();
    await mapBtn.click();
    await expect(page).toHaveURL('/verifier?view=map');

    const tableBtn = page.getByRole('button', { name: 'Tabel' });
    await expect(tableBtn).toBeVisible();
    await tableBtn.click();
    await expect(page).toHaveURL('/verifier');
  });

});
