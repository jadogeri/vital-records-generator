import { defineConfig } from '@playwright/test'
export default defineConfig({
  timeout: 180000,
  expect: { timeout: 30000 },
  testDir: './tests/ui',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: {width:1000,height:800},
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH,
      args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] } : {} },
  webServer: {
    command: 'vite --host 127.0.0.1 --port 4173 --strictPort --config vite.preview.config.ts',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI
  }
})
