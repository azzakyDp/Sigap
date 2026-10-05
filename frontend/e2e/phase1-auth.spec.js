import { test, expect } from '@playwright/test';
import { generateCitizenData, registerCitizenApi } from './helpers.js';

test.describe('Phase 1 - Auth & Access Control E2E Tests', () => {

  test('1. Register citizen -> login -> redirect to /dashboard (CITIZEN)', async ({ page }) => {
    const citizen = generateCitizenData();

    // Go to register page
    await page.goto('/register');
    await page.fill('input[name="nama"]', citizen.nama);
    await page.fill('input[name="nik"]', citizen.nik);
    await page.fill('input[name="email"]', citizen.email);
    await page.fill('input[name="nomor_hp"]', citizen.nomor_hp);
    await page.fill('input[name="password"]', citizen.password);

    await page.click('button[type="submit"]');

    // After register success, redirected to /login or /dashboard
    await page.waitForURL((url) => url.pathname === '/login' || url.pathname === '/dashboard', { timeout: 10000 });

    if (page.url().includes('/login')) {
      // Login with registered credentials
      await page.fill('input[name="identifier"]', citizen.email);
      await page.fill('input[name="password"]', citizen.password);
      await page.click('button[type="submit"]');
    }

    // Must reach /dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('2. Login with wrong password -> displays generic error message, no crash', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Error message element should be visible
    const errorMessage = page.locator('.bg-danger-light, .text-danger, [role="alert"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('3. Access /verifier without login -> redirect to /login', async ({ page }) => {
    await page.goto('/verifier');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('4. Login as citizen -> manual navigate to /verifier -> redirect to /unauthorized', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    // Login via UI
    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Attempt to access verifier page
    await page.goto('/verifier');
    await page.waitForURL((url) => url.pathname === '/unauthorized' || url.pathname === '/login', { timeout: 10000 });
    expect(page.url()).toContain('/unauthorized');
  });

  test('5. Login -> reload page -> stays on same page', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/dashboard');
  });

  test('6. Login -> overwrite localStorage token with random string -> reload -> redirects to /login', async ({ page, request }) => {
    const citizen = generateCitizenData();
    await registerCitizenApi(request, citizen);

    await page.goto('/login');
    await page.fill('input[name="identifier"]', citizen.email);
    await page.fill('input[name="password"]', citizen.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Tamper token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('sigap_token', 'invalid_random_token_string_12345');
    });

    // Reload page
    await page.reload();
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

});
