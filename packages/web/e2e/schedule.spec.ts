import { test, expect } from '@playwright/test'

test.describe('スケジュール管理', () => {
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
    const profileName = `スケジュールテスト用_${Date.now()}`
    await page.fill('#name', profileName)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard/profiles')

    // 作成したプロファイルのスケジュールリンクをクリックしてIDを取得
    const row = page.locator(`tr:has-text("${profileName}")`)
    const scheduleLink = row.locator('a[href*="/schedule"]')
    const href = await scheduleLink.getAttribute('href')
    profileId = href?.match(/\/profiles\/(\d+)\//)?.[1] ?? ''
  })

  test('スケジュール設定ページにアクセスできる', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/schedule`)
    await expect(page.locator('h1')).toHaveText('スケジュール設定')
  })

  test('スケジュールが未設定の場合は設定を促すメッセージが表示される', async ({
    page,
  }) => {
    await page.goto(`/dashboard/profiles/${profileId}/schedule`)
    await expect(
      page.locator('text=スケジュールが設定されていません')
    ).toBeVisible()
    await expect(page.locator('text=スケジュールを設定する')).toBeVisible()
  })

  test('毎日スケジュールを設定できる', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/schedule`)
    await page.click('text=スケジュールを設定する')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/schedule/edit`
    )

    // 毎日を選択
    await page.selectOption('#schedule_type', 'daily')
    await page.fill('#daily_time', '09:00')
    await page.check('#is_enabled')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)
    await expect(page.locator('text=毎日 09:00 に実行')).toBeVisible()
  })

  test('毎週スケジュールを設定できる', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/schedule/edit`)

    // 毎週を選択
    await page.selectOption('#schedule_type', 'weekly')
    await page.selectOption('#weekly_day_of_week', '1') // 月曜日
    await page.fill('#weekly_time', '10:30')
    await page.check('#is_enabled')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)
    await expect(page.locator('text=毎週 月曜日 10:30 に実行')).toBeVisible()
  })

  test('cron形式でスケジュールを設定できる', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/schedule/edit`)

    // cron形式を選択
    await page.selectOption('#schedule_type', 'cron')
    await page.fill('#cron_expression', '0 9 * * 1-5')
    await page.check('#is_enabled')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)
    await expect(page.locator('text=cron形式')).toBeVisible()
    await expect(page.locator('text=0 9 * * 1-5')).toBeVisible()
  })

  test('スケジュールの有効/無効を切り替えられる', async ({ page }) => {
    // まずスケジュールを作成
    await page.goto(`/dashboard/profiles/${profileId}/schedule/edit`)
    await page.selectOption('#schedule_type', 'daily')
    await page.fill('#daily_time', '09:00')
    await page.check('#is_enabled')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)

    // 有効状態を確認
    await expect(page.locator('button:has-text("有効")')).toBeVisible()

    // クリックして無効に
    await page.click('button:has-text("有効")')
    await expect(page.locator('button:has-text("無効")')).toBeVisible()
  })

  test('スケジュールを削除できる', async ({ page }) => {
    // まずスケジュールを作成
    await page.goto(`/dashboard/profiles/${profileId}/schedule/edit`)
    await page.selectOption('#schedule_type', 'daily')
    await page.fill('#daily_time', '09:00')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)

    // ダイアログを処理
    page.on('dialog', (dialog) => dialog.accept())

    // 削除ボタンをクリック
    await page.click('button:has-text("削除")')

    // 削除されたことを確認
    await expect(
      page.locator('text=スケジュールが設定されていません')
    ).toBeVisible()
  })

  test('スケジュールを編集できる', async ({ page }) => {
    // まずスケジュールを作成
    await page.goto(`/dashboard/profiles/${profileId}/schedule/edit`)
    await page.selectOption('#schedule_type', 'daily')
    await page.fill('#daily_time', '09:00')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)

    // 編集ページへ
    await page.click('text=編集')
    await expect(page).toHaveURL(
      `/dashboard/profiles/${profileId}/schedule/edit`
    )

    // 時刻を変更
    await page.fill('#daily_time', '15:30')
    await page.click('button[type="submit"]')

    // 変更が反映されていることを確認
    await expect(page).toHaveURL(`/dashboard/profiles/${profileId}/schedule`)
    await expect(page.locator('text=15:30')).toBeVisible()
  })

  test('プロファイル一覧に戻るリンクが機能する', async ({ page }) => {
    await page.goto(`/dashboard/profiles/${profileId}/schedule`)
    await page.click('text=← プロファイル一覧に戻る')
    await expect(page).toHaveURL('/dashboard/profiles')
  })
})

test.describe('スケジュールルート保護', () => {
  test('未認証状態でスケジュール設定にアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/profiles/1/schedule')
    await expect(page).toHaveURL('/login')
  })

  test('未認証状態で編集ページにアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    await page.goto('/dashboard/profiles/1/schedule/edit')
    await expect(page).toHaveURL('/login')
  })
})
