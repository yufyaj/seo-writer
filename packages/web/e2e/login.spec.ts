import { test, expect } from '@playwright/test'

test.describe('ログイン機能', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('/login')
  })

  test('ログインページが表示される', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('ログイン')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('有効な認証情報でログインできる', async ({ page }) => {
    // フォームに入力
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // ログインボタンをクリック
    await page.click('button[type="submit"]')

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toHaveText('ダッシュボード')
    await expect(page.locator('text=ようこそ、test@example.com さん')).toBeVisible()
  })

  test('無効なメールアドレスでエラーが表示される', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'password123')

    await page.click('button[type="submit"]')

    // エラーメッセージが表示されることを確認
    const errorMessage = page.getByText('メールアドレスまたはパスワードが正しくありません')
    await expect(errorMessage).toBeVisible()

    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login')
  })

  test('無効なパスワードでエラーが表示される', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // エラーメッセージが表示されることを確認
    const errorMessage = page.getByText('メールアドレスまたはパスワードが正しくありません')
    await expect(errorMessage).toBeVisible()

    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login')
  })

  test('空のフォームで送信するとHTML5バリデーションエラー', async ({ page }) => {
    // 空のまま送信を試みる
    await page.click('button[type="submit"]')

    // HTML5のrequired属性によりブラウザのバリデーションが働く
    // ページ遷移しないことを確認
    await expect(page).toHaveURL('/login')
  })
})

test.describe('認証後の動作', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('ダッシュボードが表示される', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('ダッシュボード')
    await expect(page.locator('text=test@example.com')).toBeVisible()
  })

  test('ログアウトできる', async ({ page }) => {
    // ログアウトボタンをクリック
    await page.click('button:has-text("ログアウト")')

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login')
  })

  test('ログイン済みの状態でログインページにアクセスするとダッシュボードにリダイレクトされる', async ({
    page,
  }) => {
    // ログインページに移動を試みる
    await page.goto('/login')

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('ルート保護', () => {
  test('未認証状態でダッシュボードにアクセスするとログインページにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login')
  })

  test('ホームページは未認証でもアクセスできる', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toHaveText('SEO Writer')
    await expect(page.locator('text=ログイン')).toBeVisible()
  })
})
