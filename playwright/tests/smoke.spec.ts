import { expect, test } from '@playwright/test';
import { resetDatabase } from '../src/db';

// Base URL for direct API calls; playwright.config.ts's `baseURL` is for the
// `page` fixture (the Angular app), which is a different origin.
const API = process.env.PW_API_URL ?? 'http://rest:9966/petclinic/api';
const HEALTH_URL = API.replace(/\/api$/, '/actuator/health');

test.beforeAll(async () => {
  await resetDatabase();
});

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

  // This is the single most valuable assertion in this file: it proves the
  // build-time environment.prod.ts rewrite (docker/angular.Dockerfile)
  // actually took effect. If it silently no-ops, every other UI test fails
  // with an opaque connection/CORS error instead of a clear signal here.
  expect(apiCalls.length).toBeGreaterThan(0);
  expect(apiCalls.every((u) => u.startsWith('http://rest:9966/'))).toBeTruthy();
});

test('resetDatabase() restores the seed after a mutation', async ({ request }) => {
  const created = await request.post(`${API}/owners`, {
    data: {
      firstName: 'Temp',
      lastName: 'Owner',
      address: '1 Test St.',
      city: 'Testville',
      telephone: '1234567890',
    },
  });
  expect(created.ok()).toBeTruthy();
  expect(await (await request.get(`${API}/owners`)).json()).toHaveLength(11);

  await resetDatabase();

  const after: Array<{ id: number; firstName: string; lastName: string }> = await (
    await request.get(`${API}/owners`)
  ).json();
  expect(after).toHaveLength(10);
  expect(after[0]).toMatchObject({ id: 1, firstName: 'George', lastName: 'Franklin' });
});
