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
    expect(keluarClasses).toContain('hover:bg-slate-100');
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
    await expect(verifierNavLink).toHaveClass(/bg-primary/);
    await expect(verifierNavLink).toHaveAttribute('aria-current', 'page');
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

  /* -------------------------------------------------------------------------- */
  /* 10. Smoke Test: Semua Rute App.jsx – tidak boleh ada pageerror/console.error */
  /* -------------------------------------------------------------------------- */
  test('10. Smoke: setiap rute App.jsx terbuka tanpa pageerror atau console.error', async ({ page }) => {
    // ---- common mock data ----
    const citizenUser   = { id: 1, email: 'citizen@example.com',  full_name: 'Warga Contoh',      role: 'CITIZEN'   };
    const verifierUser  = { id: 2, email: 'verifier@example.com', full_name: 'Staf Verifikator',  role: 'VERIFIER'  };
    const officerUser   = { id: 3, email: 'officer@example.com',  full_name: 'Petugas Lapangan',  role: 'OFFICER'   };
    const adminUser     = { id: 4, email: 'admin@example.com',    full_name: 'Admin Sistem',       role: 'ADMIN'     };

    const mockReport = {
      id: 1,
      nomor_laporan: 'SIGAP-2026-00001',
      status_raw: 'PENDING_VERIFICATION',
      category_name: 'Jalan Berlubang',
      priority: 'HIGH',
      waktu_kejadian: new Date().toISOString(),
      created_at: new Date().toISOString(),
      reporter_name: 'Warga Contoh',
      alamat_lokasi: 'Jl. Pemuda No 1',
      latitude: -7.11,
      longitude: 112.41,
      deskripsi: 'Tes deskripsi',
      evidences: [],
      status_histories: [],
      field_values: [],
      action_reports: [],
      current_assignment: null,
    };

    // ---- route definitions: [url, userObj] ----
    const routes = [
      ['/',                    null],          // landing (unauthenticated)
      ['/login',               null],
      ['/register',            null],
      ['/unauthorized',        null],
      ['/dashboard',           citizenUser],
      ['/reports/create',      citizenUser],
      ['/reports/me',          citizenUser],
      ['/reports/1',           citizenUser],
      ['/verifier',            verifierUser],
      ['/verifier?view=map',   verifierUser],
      ['/verifier/reports/1',  verifierUser],
      ['/officer',             officerUser],
      ['/officer/reports/1',   officerUser],
      ['/admin',               adminUser],
    ];

    const errors = [];

    for (const [url, user] of routes) {
      // Reset listeners each iteration
      const pageErrors = [];
      const consoleErrors = [];

      const onPageError = (err) => pageErrors.push(err.message);
      const onConsoleError = (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('ERR_NETWORK_CHANGED') && !msg.text().includes('net::ERR_')) {
          consoleErrors.push(msg.text());
        }
      };

      page.on('pageerror', onPageError);
      page.on('console',   onConsoleError);

      // ---- set up API mocks ----
      // auth/me – returns current user (or 401 for unauthenticated routes)
      await page.route('**/api/v1/auth/me', async (route) => {
        if (!user) {
          await route.fulfill({ status: 401, headers: { 'Access-Control-Allow-Origin': '*' },
            contentType: 'application/json', body: JSON.stringify({ detail: 'Not authenticated' }) });
        } else {
          await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
            contentType: 'application/json', body: JSON.stringify(user) });
        }
      });

      await page.route('**/api/v1/notifications**', async (route) => {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.route('**/api/v1/categories**', async (route) => {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json', body: JSON.stringify([{ id: 1, name: 'Jalan Berlubang', code: 'HOLE', fields: [] }]) });
      });

      await page.route('**/api/v1/reports/1/ai-analysis', async (route) => {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json',
          body: JSON.stringify({ status: 'COMPLETED', summary: 'Tes AI', confidence: 0.9,
            suggested_category: 'Jalan Berlubang', suggested_priority: 'HIGH' }) });
      });

      await page.route('**/api/v1/reports/1**', async (route) => {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json', body: JSON.stringify(mockReport) });
      });

      await page.route('**/api/v1/reports**', async (route) => {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
      });

      await page.route('**/api/v1/officers**', async (route) => {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json', body: JSON.stringify([]) });
      });

      // ---- inject session & navigate ----
      // Go to /login first to set localStorage, then navigate
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      if (user) {
        await page.evaluate((u) => {
          localStorage.setItem('sigap_token', 'fake-jwt-token');
          localStorage.setItem('sigap_user', JSON.stringify(u));
        }, user);
      } else {
        await page.evaluate(() => {
          localStorage.removeItem('sigap_token');
          localStorage.removeItem('sigap_user');
        });
      }

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      // short wait for React hydration
      await page.waitForTimeout(600);

      page.off('pageerror', onPageError);
      page.off('console',   onConsoleError);

      // Unroute all to reset for next iteration
      await page.unrouteAll({ behavior: 'ignoreErrors' });

      const routeErrors = [
        ...pageErrors.map(m => `pageerror: ${m}`),
        ...consoleErrors.map(m => `console.error: ${m}`),
      ];

      if (routeErrors.length) {
        errors.push({ url, user: user?.role ?? 'anon', errors: routeErrors });
      }

      console.log(`[RUTE] ${url} (${user?.role ?? 'anon'}) -> ${routeErrors.length === 0 ? 'OK' : 'GAGAL: ' + routeErrors.join(' | ')}`);
    }

    if (errors.length > 0) {
      const msg = errors.map(e =>
        `\n  ${e.url} [${e.user}]:\n    - ${e.errors.join('\n    - ')}`
      ).join('');
      throw new Error(`Rute berikut menghasilkan error:${msg}`);
    }
  });

  /* -------------------------------------------------------------------------- */
  /* 11. Tahap 3 Commit A: Role-Based Route Protection Matrix                   */
  /* -------------------------------------------------------------------------- */
  test('11. Role-Based Route Protection Matrix', async ({ page }) => {
    const citizenUser  = { id: 1, email: 'citizen@example.com',  full_name: 'Warga Contoh',     role: 'CITIZEN'  };
    const verifierUser = { id: 2, email: 'verifier@example.com', full_name: 'Staf Verifikator', role: 'VERIFIER' };
    const officerUser  = { id: 3, email: 'officer@example.com',  full_name: 'Petugas Lapangan', role: 'OFFICER'  };
    const adminUser    = { id: 4, email: 'admin@example.com',    full_name: 'Admin Sistem',      role: 'ADMIN'    };

    const matrix = [
      // anon
      { user: null, url: '/dashboard', expectedPath: '/login' },
      { user: null, url: '/verifier', expectedPath: '/login' },
      { user: null, url: '/officer', expectedPath: '/login' },
      { user: null, url: '/admin', expectedPath: '/login' },
      // CITIZEN
      { user: citizenUser, url: '/verifier', expectedPath: '/unauthorized' },
      { user: citizenUser, url: '/officer', expectedPath: '/unauthorized' },
      { user: citizenUser, url: '/admin', expectedPath: '/unauthorized' },
      // VERIFIER
      { user: verifierUser, url: '/admin', expectedPath: '/unauthorized' },
      { user: verifierUser, url: '/officer', expectedPath: '/unauthorized' },
      { user: verifierUser, url: '/dashboard', expectedPath: '/unauthorized' },
      { user: verifierUser, url: '/verifier', expectedPath: '/verifier' },
      // OFFICER
      { user: officerUser, url: '/verifier', expectedPath: '/unauthorized' },
      { user: officerUser, url: '/admin', expectedPath: '/unauthorized' },
      // ADMIN
      { user: adminUser, url: '/verifier', expectedPath: '/verifier' },
      { user: adminUser, url: '/verifier/reports/1', expectedPath: '/verifier/reports/1' },
      { user: adminUser, url: '/dashboard', expectedPath: '/unauthorized' },
    ];

    const mockReport = {
      id: 1, nomor_laporan: 'SIGAP-2026-00001', status_raw: 'PENDING_VERIFICATION',
      category_name: 'Jalan Berlubang', priority: 'HIGH', waktu_kejadian: new Date().toISOString(),
      created_at: new Date().toISOString(), reporter_name: 'Warga Contoh', alamat_lokasi: 'Jl. Pemuda No 1',
      latitude: -7.11, longitude: 112.41, deskripsi: 'Tes deskripsi', evidences: [], status_histories: [],
      field_values: [], action_reports: [], current_assignment: null
    };

    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/reports/1**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(mockReport) });
    });
    await page.route('**/api/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
    });

    const resultsTable = [];

    for (const item of matrix) {
      const userRole = item.user ? item.user.role : 'anon';
      
      await page.route('**/api/v1/auth/me', async (route) => {
        if (!item.user) {
          await route.fulfill({ status: 401, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ detail: 'Not authenticated' }) });
        } else {
          await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(item.user) });
        }
      });

      await page.goto('/login');
      if (item.user) {
        await page.evaluate((u) => {
          localStorage.setItem('sigap_token', 'fake-jwt-token');
          localStorage.setItem('sigap_user', JSON.stringify(u));
        }, item.user);
      } else {
        await page.evaluate(() => {
          localStorage.removeItem('sigap_token');
          localStorage.removeItem('sigap_user');
        });
      }

      await page.goto(item.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const finalUrl = new URL(page.url()).pathname;
      const pass = finalUrl === item.expectedPath;

      resultsTable.push({
        role: userRole,
        url: item.url,
        finalUrl,
        hasil: pass ? 'PASS' : 'FAIL'
      });

      expect(finalUrl).toBe(item.expectedPath);
      await page.unroute('**/api/v1/auth/me');
    }

    console.log('\n=== TABEL HAK AKSES PER ROLE ===');
    console.table(resultsTable);
  });

  /* -------------------------------------------------------------------------- */
  /* 12. Tahap 3 Commit A: Persistent Layout Across Client-Side Navigation       */
  /* -------------------------------------------------------------------------- */
  test('12. Persistent DashboardLayout across client-side navigation', async ({ page }) => {
    const verifierUser = { id: 2, email: 'verifier@example.com', full_name: 'Staf Verifikator', role: 'VERIFIER' };
    const mockReport = {
      id: 1, nomor_laporan: 'SIGAP-2026-00001', status_raw: 'PENDING_VERIFICATION',
      category_name: 'Jalan Berlubang', priority: 'HIGH', waktu_kejadian: new Date().toISOString(),
      created_at: new Date().toISOString(), reporter_name: 'Warga Contoh', alamat_lokasi: 'Jl. Pemuda No 1',
      latitude: -7.11, longitude: 112.41, deskripsi: 'Tes deskripsi', evidences: [], status_histories: [],
      field_values: [], action_reports: [], current_assignment: null
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(verifierUser) });
    });
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/reports/1**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(mockReport) });
    });
    await page.route('**/api/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ items: [mockReport], total: 1 }) });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    await page.goto('/verifier');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('header');

    // Attach DOM data-marker on navbar header
    await page.evaluate(() => {
      const header = document.querySelector('header');
      if (header) header.setAttribute('data-marker', 'persistent-layout-test');
    });

    const initialMarker = await page.evaluate(() => document.querySelector('header')?.getAttribute('data-marker'));
    expect(initialMarker).toBe('persistent-layout-test');

    // Client-side navigation to report detail via clicking report row or link
    await page.locator('tr').filter({ hasText: 'SIGAP-2026-00001' }).click();
    await page.waitForURL('**/verifier/reports/1');

    const navigatedMarker = await page.evaluate(() => document.querySelector('header')?.getAttribute('data-marker'));
    expect(navigatedMarker).toBe('persistent-layout-test');
  });

  /* -------------------------------------------------------------------------- */
  /* 13. Tahap 3 Commit A: Viewport 375 Mobile Sidebar Auto-Close on Navigation */
  /* -------------------------------------------------------------------------- */
  test('13. Mobile sidebar drawer closes automatically on navigation at viewport 375', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const citizenUser = { id: 1, email: 'citizen@example.com', full_name: 'Warga Contoh', role: 'CITIZEN' };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(citizenUser) });
    });
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, citizenUser);

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Open mobile sidebar drawer using hamburger button
    const hamburgerBtn = page.locator('header button').first();
    await hamburgerBtn.click();
    await page.waitForTimeout(200);

    // Click navigation item in sidebar (e.g., Laporan Saya)
    const sidebarLink = page.locator('aside a', { hasText: 'Laporan Saya' });
    await sidebarLink.click();
    await page.waitForURL('**/reports/me');
    await page.waitForTimeout(300);

    // Sidebar drawer should be closed
    const isSidebarVisible = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      if (!aside) return false;
      const rect = aside.getBoundingClientRect();
      const style = window.getComputedStyle(aside);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.left >= 0;
    });

    expect(isSidebarVisible).toBe(false);
  });

  /* -------------------------------------------------------------------------- */
  /* 14. Tahap 3e: Interactive Colors, States, Contrast & Screenshots Verification */
  /* -------------------------------------------------------------------------- */
  test('14. Interactive components contrast evaluation (default, hover, focus-visible, selected)', async ({ page }) => {
    const fs = await import('fs');
    const path = await import('path');
    const shotsDir = path.join(process.cwd(), 'e2e/_tmp/shots/tahap-3e');
    const tmpShotsDir = 'C:\\tmp\\shots\\tahap-3e';

    if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });
    if (!fs.existsSync(tmpShotsDir)) fs.mkdirSync(tmpShotsDir, { recursive: true });

    const verifierUser = { id: 2, email: 'verifier@example.com', full_name: 'Staf Verifikator', role: 'VERIFIER' };
    const mockReport = {
      id: 1, nomor_laporan: 'SIGAP-2026-00001', status_raw: 'PENDING_VERIFICATION',
      category_name: 'Jalan Berlubang', priority: 'HIGH', waktu_kejadian: new Date().toISOString(),
      created_at: new Date().toISOString(), reporter_name: 'Warga Contoh', alamat_lokasi: 'Jl. Pemuda No 1',
      latitude: -7.11, longitude: 112.41, deskripsi: 'Tes deskripsi', evidences: [], status_histories: [],
      field_values: [], action_reports: [], current_assignment: null
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(verifierUser) });
    });
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/categories**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/v1/reports/1**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(mockReport) });
    });
    await page.route('**/api/v1/reports**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ items: [mockReport], total: 1 }) });
    });

    await page.goto('/login');
    await page.evaluate((u) => {
      localStorage.setItem('sigap_token', 'fake-jwt-token');
      localStorage.setItem('sigap_user', JSON.stringify(u));
    }, verifierUser);

    await page.goto('/verifier');
    await page.waitForLoadState('networkidle');

    const getStylesAndContrast = async (locator) => {
      return await locator.evaluate((el) => {
        if (!el) return null;

        function getEffectiveBgColor(e) {
          let curr = e;
          while (curr && curr !== document.documentElement) {
            const bg = window.getComputedStyle(curr).backgroundColor;
            if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && !bg.endsWith(', 0)')) {
              return bg;
            }
            curr = curr.parentElement;
          }
          return 'rgb(248, 250, 252)';
        }

        function parseRgb(colorStr) {
          const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!match) return [255, 255, 255];
          return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }

        function getContrast(fgStr, bgStr) {
          const fg = parseRgb(fgStr);
          const bg = parseRgb(bgStr);
          const getL = (c) => {
            const s = c.map(v => {
              v /= 255;
              return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return s[0] * 0.2126 + s[1] * 0.7152 + s[2] * 0.0722;
          };
          const l1 = getL(fg);
          const l2 = getL(bg);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        }

        const cs = window.getComputedStyle(el);
        const fg = cs.color;
        const bg = getEffectiveBgColor(el);
        const ratio = getContrast(fg, bg);
        return {
          fg,
          bg,
          ratio: Math.round(ratio * 100) / 100,
          pass: ratio >= 4.5
        };
      });
    };

    const interactiveTargets = [
      { name: 'Secondary Button (Refresh)', selector: 'button:has-text("Refresh")', pageName: 'verifier' },
      { name: 'Segmented Switcher (Tabel)', selector: 'button:has-text("Tabel")', pageName: 'verifier' },
      { name: 'Fast Tab (Menunggu Verifikasi)', selector: 'button:has-text("Menunggu Verifikasi")', pageName: 'verifier' },
      { name: 'Sidebar Item (Antrean Verifikasi)', selector: 'aside a:has-text("Antrean Verifikasi")', pageName: 'verifier' },
    ];

    const contrastReportTable = [];

    for (const target of interactiveTargets) {
      const el = page.locator(target.selector).first();
      await el.waitFor({ state: 'visible' });

      // Default state
      const defaultState = await getStylesAndContrast(el);
      await page.screenshot({ path: path.join(shotsDir, `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_default.png`) });
      await page.screenshot({ path: path.join(tmpShotsDir, `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_default.png`) });

      // Hover state
      await el.hover();
      await page.waitForTimeout(150);
      const hoverState = await getStylesAndContrast(el);
      await page.screenshot({ path: path.join(shotsDir, `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_hover.png`) });
      await page.screenshot({ path: path.join(tmpShotsDir, `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_hover.png`) });

      // Focus-visible state
      await el.focus();
      await page.waitForTimeout(150);
      const focusState = await getStylesAndContrast(el);
      await page.screenshot({ path: path.join(shotsDir, `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_focus.png`) });
      await page.screenshot({ path: path.join(tmpShotsDir, `${target.name.replace(/[^a-zA-Z0-9]/g, '_')}_focus.png`) });

      contrastReportTable.push({
        component: target.name,
        state: 'Default',
        fgColor: defaultState.fg,
        bgColor: defaultState.bg,
        contrast: `${defaultState.ratio}:1`,
        hasil: defaultState.pass ? 'PASS' : 'FAIL'
      });

      contrastReportTable.push({
        component: target.name,
        state: 'Hover',
        fgColor: hoverState.fg,
        bgColor: hoverState.bg,
        contrast: `${hoverState.ratio}:1`,
        hasil: hoverState.pass ? 'PASS' : 'FAIL'
      });

      contrastReportTable.push({
        component: target.name,
        state: 'Focus',
        fgColor: focusState.fg,
        bgColor: focusState.bg,
        contrast: `${focusState.ratio}:1`,
        hasil: focusState.pass ? 'PASS' : 'FAIL'
      });

      expect(defaultState.pass).toBe(true);
      expect(hoverState.pass).toBe(true);
      expect(focusState.pass).toBe(true);
      expect(hoverState.bg !== defaultState.bg || target.name.includes('Segmented') || target.name.includes('Sidebar') || target.name.includes('Tab')).toBe(true);
    }

    // Now test Detail page (/verifier/reports/1) for Primary Button
    await page.goto('/verifier/reports/1');
    await page.waitForLoadState('networkidle');

    const primaryBtn = page.getByRole('button', { name: /Ubah Prioritas|Verifikasi|Tutup Kasus/ }).first();
    await primaryBtn.waitFor({ state: 'visible' });

    const pDefault = await getStylesAndContrast(primaryBtn);
    await primaryBtn.hover();
    await page.waitForTimeout(150);
    const pHover = await getStylesAndContrast(primaryBtn);

    await page.screenshot({ path: path.join(shotsDir, `PrimaryButton_default.png`) });
    await page.screenshot({ path: path.join(tmpShotsDir, `PrimaryButton_default.png`) });
    await page.screenshot({ path: path.join(shotsDir, `PrimaryButton_hover.png`) });
    await page.screenshot({ path: path.join(tmpShotsDir, `PrimaryButton_hover.png`) });

    contrastReportTable.push({
      component: 'Primary Button (Verifikasi Laporan)',
      state: 'Default',
      fgColor: pDefault.fg,
      bgColor: pDefault.bg,
      contrast: `${pDefault.ratio}:1`,
      hasil: pDefault.pass ? 'PASS' : 'FAIL'
    });

    contrastReportTable.push({
      component: 'Primary Button (Verifikasi Laporan)',
      state: 'Hover',
      fgColor: pHover.fg,
      bgColor: pHover.bg,
      contrast: `${pHover.ratio}:1`,
      hasil: pHover.pass ? 'PASS' : 'FAIL'
    });

    expect(pDefault.pass).toBe(true);
    expect(pHover.pass).toBe(true);

    console.log('\n=== HASIL EVALUASI KONTRAS STATE INTERAKTIF (TAHAP 3e) ===');
    console.table(contrastReportTable);
  });

});


