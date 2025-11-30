import { test, expect } from '@playwright/test'

test.describe('会社・サイト設定', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('設定ページにアクセスできる', async ({ page }) => {
    await page.click('text=会社・サイト設定')
    await expect(page).toHaveURL('/dashboard/settings')
    await expect(page.locator('h1')).toHaveText('会社・サイト設定')
  })

  test('会社情報を登録できる', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // フォームに入力
    await page.fill('#company_name', 'テスト株式会社')
    await page.fill('#brand_name', 'テストブランド')
    await page.fill('#about_text', 'テスト会社の紹介文です。')
    await page.fill('#site_url', 'https://example.com')
    await page.fill('#wp_base_url', 'https://blog.example.com')
    await page.fill('#wp_username', 'admin')
    await page.fill('#wp_app_password', 'xxxx xxxx xxxx xxxx')
    await page.selectOption('#wp_default_status', 'draft')

    // 送信
    await page.click('button[type="submit"]')

    // ページがリロードされて値が保持されていることを確認
    await page.waitForTimeout(1000)
    await expect(page.locator('#company_name')).toHaveValue('テスト株式会社')
  })

  test('必須フィールドが空の場合にバリデーションエラーが表示される', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings')

    // 会社名を空にして送信を試みる
    await page.fill('#wp_base_url', 'https://blog.example.com')
    await page.fill('#wp_username', 'admin')
    await page.fill('#wp_app_password', 'xxxx xxxx xxxx xxxx')

    await page.click('button[type="submit"]')

    // HTML5バリデーションでブロックされることを確認
    await expect(page).toHaveURL('/dashboard/settings')
  })

  test('無効なURLでHTML5バリデーションエラー', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.fill('#company_name', 'テスト株式会社')
    // type="url"のフィールドに無効なURLを入力
    await page.fill('#site_url', 'invalid-url')
    await page.fill('#wp_base_url', 'https://blog.example.com')
    await page.fill('#wp_username', 'admin')
    await page.fill('#wp_app_password', 'xxxx xxxx xxxx xxxx')

    await page.click('button[type="submit"]')

    // HTML5バリデーションでブロックされ、ページ遷移しないことを確認
    await expect(page).toHaveURL('/dashboard/settings')
  })

  test('ダッシュボードに戻るリンクが機能する', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.click('text=ダッシュボードに戻る')

    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('ルート保護', () => {
  test('未認証状態で設定ページにアクセスするとログインページにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings')

    await expect(page).toHaveURL('/login')
  })
})
