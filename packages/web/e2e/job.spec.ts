import { test, expect } from '@playwright/test'

test.describe('ジョブ管理', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('ダッシュボードからジョブ履歴ページにアクセスできる', async ({
    page,
  }) => {
    await page.click('text=ジョブ履歴')
    await expect(page).toHaveURL('/dashboard/jobs')
    await expect(page.locator('h1')).toHaveText('ジョブ履歴')
  })

  test('ジョブ履歴ページでジョブがない場合のメッセージが表示される', async ({
    page,
  }) => {
    await page.goto('/dashboard/jobs')
    // ジョブがない場合はメッセージが表示される
    const emptyMessage = page.locator('text=ジョブ履歴がありません')
    const table = page.locator('table')

    // どちらかが表示される
    const isEmpty = await emptyMessage.isVisible().catch(() => false)
    const hasTable = await table.isVisible().catch(() => false)

    expect(isEmpty || hasTable).toBeTruthy()
  })

  test('ジョブ履歴ページからダッシュボードに戻れる', async ({ page }) => {
    await page.goto('/dashboard/jobs')
    await page.click('text=← ダッシュボードに戻る')
    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('記事生成ボタン', () => {
  let profileId: string

  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // 会社設定がない場合は作成
    await page.goto('/dashboard/settings')
    const companyNameInput = page.locator('#company_name')
    if ((await companyNameInput.inputValue()) === '') {
      await page.fill('#company_name', 'テスト株式会社')
      await page.fill('#wp_base_url', 'https://blog.example.com')
      await page.fill('#wp_username', 'admin')
      await page.fill('#wp_app_password', 'xxxx xxxx xxxx xxxx')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
    }

    // テスト用プロファイルを作成
    await page.goto('/dashboard/profiles/new')
    const profileName = `ジョブテスト用_${Date.now()}`
    await page.fill('#name', profileName)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard/profiles')

    // 作成したプロファイルの記事タイプリンクをクリックしてIDを取得
    const row = page.locator(`tr:has-text("${profileName}")`)
    const articleTypeLink = row.locator('a[href*="/article-types"]')
    const href = await articleTypeLink.getAttribute('href')
    profileId = href?.match(/\/profiles\/(\d+)\//)?.[1] ?? ''

    // テスト用の記事タイプを作成
    await page.goto(`/dashboard/profiles/${profileId}/article-types/new`)
    await page.fill('#name', 'テスト記事タイプ')
    await page.fill(
      '#prompt_template',
      '## テスト記事\n\n{keyword}に関する記事を書いてください。'
    )
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )
  })

  test('記事タイプ一覧に記事生成ボタンが表示される', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types`)

    const generateButton = page.locator('button:has-text("記事生成")')
    await expect(generateButton).toBeVisible()
  })

  test('無効な記事タイプの記事生成ボタンは非活性', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types`)

    // まず有効な状態を確認
    const statusButton = page.locator(
      'tr:has-text("テスト記事タイプ") button:has-text("有効")'
    )
    await expect(statusButton).toBeVisible()

    // 無効に切り替え
    await statusButton.click()
    await expect(
      page.locator('tr:has-text("テスト記事タイプ") button:has-text("無効")')
    ).toBeVisible()

    // 記事生成ボタンが非活性であることを確認
    const generateButton = page.locator(
      'tr:has-text("テスト記事タイプ") button:has-text("記事生成")'
    )
    await expect(generateButton).toBeDisabled()
  })

  test('記事生成ボタンをクリックすると確認ダイアログが表示される', async ({
    page,
  }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types`)

    // ダイアログをキャンセル
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('記事を生成しますか')
      await dialog.dismiss()
    })

    // 記事生成ボタンをクリック
    const generateButton = page.locator(
      'tr:has-text("テスト記事タイプ") button:has-text("記事生成")'
    )
    await generateButton.click()
  })
})

test.describe('ジョブルート保護', () => {
  test('未認証状態でジョブ一覧にアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/jobs')
    await expect(page).toHaveURL('/login')
  })

  test('未認証状態でジョブ詳細にアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/jobs/1')
    await expect(page).toHaveURL('/login')
  })
})
