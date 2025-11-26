import { test, expect } from '@playwright/test'

test.describe('記事タイプ管理', () => {
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
    const profileName = `記事タイプテスト用_${Date.now()}`
    await page.fill('#name', profileName)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard/profiles')

    // 作成したプロファイルの記事タイプリンクをクリックしてIDを取得
    const row = page.locator(`tr:has-text("${profileName}")`)
    const articleTypeLink = row.locator('a[href*="/article-types"]')
    const href = await articleTypeLink.getAttribute('href')
    profileId = href?.match(/\/profiles\/(\d+)\//)?.[1] ?? ''
  })

  test('記事タイプ一覧ページにアクセスできる', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types`)
    await expect(page.locator('h1')).toHaveText('記事タイプ')
  })

  test('新規記事タイプを作成できる', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types`)
    await page.click('text=新規作成')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types/new`
    )

    const uniqueName = `テスト記事タイプ_${Date.now()}`
    const promptTemplate = `## 記事構成
1. 導入
2. 本文
3. まとめ

## 制約
- 3000文字以上`

    await page.fill('#name', uniqueName)
    await page.fill('#description', 'テスト用の記事タイプです')
    await page.fill('#prompt_template', promptTemplate)

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible()
  })

  test('記事タイプを編集できる', async ({ page }) => {
    const baseName = `編集テスト_${Date.now()}`
    const editedName = `編集後_${Date.now()}`

    // まず新規作成
    await page.goto(`/dashboard/profiles/${profileId}/article-types/new`)
    await page.fill('#name', baseName)
    await page.fill('#prompt_template', 'テンプレート内容')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )

    // 編集ページへ
    await page.click(`text=${baseName}`)
    await expect(page.locator('h1')).toHaveText('記事タイプ編集')

    // 編集
    await page.fill('#name', editedName)
    await page.fill('#description', '編集後の説明')
    await page.click('button[type="submit"]')

    // 一覧で確認
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )
    await expect(page.locator(`text=${editedName}`)).toBeVisible()
  })

  test('記事タイプの有効/無効を切り替えられる', async ({ page }) => {
    const uniqueName = `ステータステスト_${Date.now()}`

    // まず新規作成
    await page.goto(`/dashboard/profiles/${profileId}/article-types/new`)
    await page.fill('#name', uniqueName)
    await page.fill('#prompt_template', 'テンプレート内容')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )

    // 初期状態は有効
    const statusButton = page.locator(
      `tr:has-text("${uniqueName}") button:has-text("有効")`
    )
    await expect(statusButton).toBeVisible()

    // クリックして無効に
    await statusButton.click()
    await expect(
      page.locator(`tr:has-text("${uniqueName}") button:has-text("無効")`)
    ).toBeVisible()
  })

  test('記事タイプを削除できる', async ({ page }) => {
    const uniqueName = `削除テスト_${Date.now()}`

    // まず新規作成
    await page.goto(`/dashboard/profiles/${profileId}/article-types/new`)
    await page.fill('#name', uniqueName)
    await page.fill('#prompt_template', 'テンプレート内容')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )

    // ダイアログを処理
    page.on('dialog', (dialog) => dialog.accept())

    // 削除ボタンをクリック
    await page.click(`tr:has-text("${uniqueName}") button:has-text("削除")`)

    // 削除されたことを確認
    await expect(page.locator(`text=${uniqueName}`)).not.toBeVisible()
  })

  test('必須フィールドが空の場合はバリデーションエラー', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types/new`)

    // 名前を入力せずに送信を試みる
    await page.click('button[type="submit"]')

    // HTML5バリデーションでブロックされることを確認
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types/new`
    )
  })

  test('記事タイプ一覧に戻るリンクが機能する', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types/new`)
    await page.click('text=← 記事タイプ一覧に戻る')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/article-types`
    )
  })

  test('プロファイル一覧に戻るリンクが機能する', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/article-types`)
    await page.click('text=← プロファイル一覧に戻る')
    await expect(page).toHaveURL('/dashboard/profiles')
  })
})

test.describe('記事タイプルート保護', () => {
  test('未認証状態で記事タイプ一覧にアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/profiles/1/article-types')
    await expect(page).toHaveURL('/login')
  })

  test('未認証状態で新規作成ページにアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/profiles/1/article-types/new')
    await expect(page).toHaveURL('/login')
  })
})
