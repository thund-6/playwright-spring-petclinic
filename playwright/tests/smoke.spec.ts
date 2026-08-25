import { expect, test } from '@playwright/test';

// Base URL for direct API calls; playwright.config.ts's `baseURL` is for the
// `page` fixture (the Angular app), which is a different origin.
const API = process.env.PW_API_URL ?? 'http://rest:9966/petclinic/api';
const HEALTH_URL = API.replace(/\/api$/, '/actuator/health');

// The seed is loaded once by global-setup.ts, not per test - these two
// checks are read-only so they stay valid no matter what else is running
// concurrently against the shared REST/DB instance.
test('REST service is up, reachable, and seeded', async ({ request }) => {
  expect((await request.get(HEALTH_URL)).ok()).toBeTruthy();

  const owners = await request.get(`${API}/owners`);
  expect(owners.ok()).toBeTruthy();
  expect(await owners.json()).toHaveLength(10);

  const vets = await request.get(`${API}/vets`);
  expect(await vets.json()).toHaveLength(6);
});

test('Angular app is served under /petclinic/ and calls the rest container', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/petclinic/api/')) apiCalls.push(r.url());
  });

  await page.goto('/'); // nginx 302s to /petclinic/
  await expect(page).toHaveURL(/\/petclinic\/?$/);
  await expect(page.getByRole('heading', { name: 'Welcome to Petclinic' })).toBeVisible();

  await page.goto('/petclinic/vets'); // deep link: nginx try_files -> Angular router
  await expect(page.locator('#vets tbody > tr')).toHaveCount(6);
  await expect(page.locator('#vets')).toContainText('James Carter');

  // Proves the app calls the REST API same-origin, through nginx's
  // /petclinic/api/ proxy (docker/nginx.conf) - not cross-origin at
  // http://rest:9966/ directly, which a host browser can't resolve and
  // which would otherwise surface as an opaque CORS error.
  expect(apiCalls.length).toBeGreaterThan(0);
  expect(apiCalls.every((u) => u.includes('/petclinic/api/'))).toBeTruthy();
  expect(apiCalls.every((u) => !u.startsWith('http://rest:9966/'))).toBeTruthy();
});
