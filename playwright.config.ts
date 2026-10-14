import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end checks of the portfolio guide: the visual flow in a real Chrome (WebGPU voice, page moves, tours,
 * highlights) and an assessment of the answers it shows. Runs against the local site and the local guide API,
 * which use the real model, so the suite runs one test at a time and stays inside the local budget.
 * Start both first: `npm run dev` and `cd guide-api && npm run dev`.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [
    { name: 'desktop', use: {}, testIgnore: /mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /mobile/ },
  ],
  webServer: [
    { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
    { command: 'npm --prefix guide-api run dev', url: 'http://127.0.0.1:8787/health', reuseExistingServer: true, timeout: 120_000 },
  ],
})
