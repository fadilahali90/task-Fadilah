import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  testDir: './tests',
  timeout: 30000,
  reporter: [
    ['html', { open: 'never' }]
  ],
  // retries: 1,
  use: {
    headless: false, // <-- browser GUI, tukar true untuk headless
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure'
    // video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});