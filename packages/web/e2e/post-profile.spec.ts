import { test, expect } from '@playwright/test'

test.describe('投稿プロファイル管理', () => {
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
  })

  test('プロファイル一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('text=投稿プロファイル')
    await expect(page).toHaveURL('/dashboard/profiles')
    await expect(page.locator('h1')).toHaveText('投稿プロファイル')
  })

  test('新規プロファイルを作成できる', async ({ page }) => {
    await page.goto('/dashboard/profiles')
    await page.click('text=新規作成')
    await expect(page).toHaveURL('/dashboard/profiles/new')

    // ユニークなプロファイル名を生成
    const uniqueName = `テストプロファイル_${Date.now()}`

    // フォームに入力
    await page.fill('#name', uniqueName)
    await page.fill('#description', 'テスト用のプロファイルです')
    await page.fill('#wp_category_id', '5')

    // キーワード戦略を入力
    await page.fill('#strategy_concept', 'SEO戦略のコンセプト')

    // 送信
    await page.click('button[type="submit"]')

    // 一覧ページにリダイレクト
    await expect(page).toHaveURL('/dashboard/profiles')
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible()
  })

  test('プロファイルを編集できる', async ({ page }) => {
    // ユニークな名前を生成
    const baseName = `編集テスト_${Date.now()}`
    const editedName = `編集後_${Date.now()}`

    // まず新規作成
    await page.goto('/dashboard/profiles/new')
    await page.fill('#name', baseName)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard/profiles')

    // 編集ページへ
    await page.click(`text=${baseName}`)
    await expect(page.locator('h1')).toHaveText('プロファイル編集')

    // 編集
    await page.fill('#name', editedName)
    await page.fill('#description', '編集後の説明')
    await page.click('button[type="submit"]')

    // 一覧で確認
    await expect(page).toHaveURL('/dashboard/profiles')
    await expect(page.locator(`text=${editedName}`)).toBeVisible()
  })

  test('プロファイルの有効/無効を切り替えられる', async ({ page }) => {
    const uniqueName = `ステータステスト_${Date.now()}`

    // まず新規作成
    await page.goto('/dashboard/profiles/new')
    await page.fill('#name', uniqueName)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard/profiles')

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

  test('プロファイルを削除できる', async ({ page }) => {
    const uniqueName = `削除テスト_${Date.now()}`

    // まず新規作成
    await page.goto('/dashboard/profiles/new')
    await page.fill('#name', uniqueName)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard/profiles')

    // ダイアログを処理
    page.on('dialog', (dialog) => dialog.accept())

    // 削除ボタンをクリック
    await page.click(`tr:has-text("${uniqueName}") button:has-text("削除")`)

    // 削除されたことを確認
    await expect(page.locator(`text=${uniqueName}`)).not.toBeVisible()
  })

  test('必須フィールドが空の場合はバリデーションエラー', async ({ page }) => {
    await page.goto('/dashboard/profiles/new')

    // 名前を入力せずに送信を試みる
    await page.click('button[type="submit"]')

    // HTML5バリデーションでブロックされることを確認
    await expect(page).toHaveURL('/dashboard/profiles/new')
  })

  test('キーワード戦略にキーワードを追加できる', async ({ page }) => {
    const uniqueName = `キーワードテスト_${Date.now()}`
    const uniqueKeyword = `テストキーワード_${Date.now()}`

    await page.goto('/dashboard/profiles/new')
    await page.fill('#name', uniqueName)

    // キーワードを追加
    const keywordInput = page.locator('input[placeholder="キーワードを入力してEnter"]').first()
    await keywordInput.fill(uniqueKeyword)
    await keywordInput.press('Enter')

    // タグが表示されることを確認
    await expect(page.locator(`text=${uniqueKeyword}`).first()).toBeVisible()

    // 送信
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard/profiles')
  })

  test('ダッシュボードに戻るリンクが機能する', async ({ page }) => {
    await page.goto('/dashboard/profiles')
    await page.click('text=← ダッシュボードに戻る')
    await expect(page).toHaveURL('/dashboard')
  })
})

test.describe('プロファイルルート保護', () => {
  test('未認証状態でプロファイル一覧にアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/profiles')
    await expect(page).toHaveURL('/login')
  })

  test('未認証状態で新規作成ページにアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/profiles/new')
    await expect(page).toHaveURL('/login')
  })
})
