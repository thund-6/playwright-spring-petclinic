import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',

  // A single shared Postgres + REST instance backs every test, and
  // resetDatabase() (src/db.ts) truncates globally - running spec files in
  // parallel would let one file's reset stomp on another's fixtures mid-test.
  // To lift this later, namespace fixtures per worker (testInfo.parallelIndex)
  // instead of removing these two lines.
  fullyParallel: false,
  workers: 1,
  retries: 0,

  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,

  reporter: [
    ['list'],
    // open: 'never' - otherwise a failing local run tries to spawn a browser
    // to show the report, which does not exist inside this container.
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],

  use: {
    // Origin only: the app is served under /petclinic/, and specs use
    // absolute paths (page.goto('/petclinic/owners')) so they read honestly
    // regardless of what baseURL's path component is.
    baseURL: process.env.PW_BASE_URL ?? 'http://angular:8080',
    // retries is 0 above, so 'on-first-retry' would never capture anything.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The app formats dates with moment()/MomentDateAdapter in the browser's
    // local time zone - pin it so date assertions can't flake by a day.
    timezoneId: 'UTC',
    locale: 'en-US',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
