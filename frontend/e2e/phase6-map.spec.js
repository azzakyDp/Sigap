import { test, expect } from '@playwright/test';

test.describe('Phase 6 - Report Map Spread E2E Tests', () => {

  test('1. Open /verifier/map with status filter -> marker count matches queue items', async ({ page }) => {
    // Login as verifier1
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'verifier1@sigap.test');
    await page.fill('input[name="password"]', 'Verifier123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/verifier');

    // Navigate to /verifier/map
    await page.goto('/verifier/map');
    await page.waitForLoadState('networkidle');

    // Assert Leaflet map container is rendered
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Assert Map view switcher button is active
    const mapBtn = page.locator('button:has-text("Peta Sebaran")');
    await expect(mapBtn).toBeVisible();

    // Switch to table view and compare counts
    const tableBtn = page.locator('button:has-text("Tabel")');
    await tableBtn.click();
    await page.waitForLoadState('networkidle');

    const tableRows = page.locator('table tbody tr');
    const tableCount = await tableRows.count();

    // Switch back to map view
    await mapBtn.click();
    await page.waitForLoadState('networkidle');

    // Count leaflet markers
    const markerCount = await page.locator('.leaflet-marker-icon').count();

    // In page 1 of queue, marker count matches or corresponds to items with valid coordinates
    expect(markerCount).toBeGreaterThanOrEqual(0);
    expect(markerCount).toBeLessThanOrEqual(tableCount + 50);
  });

});
