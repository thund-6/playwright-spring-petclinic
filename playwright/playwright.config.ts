import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  // Runs once before the whole suite, not per file/worker - the shared
  // Postgres + REST instance is seeded exactly once. Individual tests must
  // not depend on a pristine table; they should either read-only or clean up
  // their own writes, since other tests may run concurrently against the
  // same data.
  globalSetup: './global-setup.ts',

  // Tests run in parallel across files and within a file. The shared
  // Postgres + REST instance is only reset once up front (see global setup /
  // the first beforeAll) - after that, tests must either avoid mutating
  // shared data or clean up after themselves so concurrent tests don't
  // observe each other's writes.
  fullyParallel: true,
  workers: process.env.CI ? '100%' : '50%',
  retries: process.env.CI ? 2 : 0,

  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,

  reporter: [
    ['list'],
    ['junit', { outputFile: './test-results/results.xml' }],
    // open: 'never' - otherwise a failing local run tries to spawn a browser
    // to show the report, which does not exist inside this container.
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],

  use: {
    // Origin only: the app is served under /petclinic/, and specs use
    // absolute paths (page.goto('/petclinic/owners')) so they read honestly
    // regardless of what baseURL's path component is.
    baseURL: process.env.PW_BASE_URL ?? 'http://angular:8080',
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

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
