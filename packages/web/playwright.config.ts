import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 開発サーバーのコンパイル競合を避けるため直列実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 開発サーバーの過負荷を防ぐため1ワーカー
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60000, // タイムアウトを60秒に延長

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    navigationTimeout: 30000, // ナビゲーションタイムアウト
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
