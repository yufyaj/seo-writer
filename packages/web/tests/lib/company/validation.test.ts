import {
  companyCreateSchema,
  companyUpdateSchema,
  wpStatusValues,
  type CompanyCreateInput,
  type CompanyUpdateInput,
} from '@/lib/company/validation'

describe('companyCreateSchema', () => {
  const validInput: CompanyCreateInput = {
    company_name: '株式会社テスト',
    brand_name: 'テストブランド',
    about_text: '会社紹介文です',
    site_url: 'https://example.com',
    wp_base_url: 'https://blog.example.com',
    wp_username: 'admin',
    wp_app_password: 'xxxx xxxx xxxx xxxx',
    wp_default_status: 'draft',
  }

  it('有効な入力を受け入れる', () => {
    const result = companyCreateSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company_name).toBe('株式会社テスト')
    }
  })

  it('必須フィールドのみでも受け入れる', () => {
    const minimalInput = {
      company_name: '株式会社テスト',
      wp_base_url: 'https://blog.example.com',
      wp_username: 'admin',
      wp_app_password: 'xxxx xxxx xxxx xxxx',
    }

    const result = companyCreateSchema.safeParse(minimalInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.wp_default_status).toBe('draft')
    }
  })

  describe('company_name', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, company_name: '' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['company_name'])
        expect(result.error.issues[0].message).toBe('会社名を入力してください')
      }
    })

    it('255文字を超える場合を拒否', () => {
      const input = { ...validInput, company_name: 'a'.repeat(256) }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['company_name'])
      }
    })
  })

  describe('brand_name', () => {
    it('空文字を許可', () => {
      const input = { ...validInput, brand_name: '' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('255文字を超える場合を拒否', () => {
      const input = { ...validInput, brand_name: 'a'.repeat(256) }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['brand_name'])
      }
    })
  })

  describe('site_url', () => {
    it('空文字を許可', () => {
      const input = { ...validInput, site_url: '' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('無効なURLを拒否', () => {
      const input = { ...validInput, site_url: 'invalid-url' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['site_url'])
      }
    })

    it('有効なURLを受け入れる', () => {
      const input = { ...validInput, site_url: 'https://example.com/path' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('wp_base_url', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, wp_base_url: '' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_base_url'])
      }
    })

    it('無効なURLを拒否', () => {
      const input = { ...validInput, wp_base_url: 'not-a-url' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_base_url'])
      }
    })
  })

  describe('wp_username', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, wp_username: '' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_username'])
      }
    })
  })

  describe('wp_app_password', () => {
    it('空文字を拒否（新規作成時は必須）', () => {
      const input = { ...validInput, wp_app_password: '' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_app_password'])
      }
    })
  })

  describe('wp_default_status', () => {
    it.each(wpStatusValues)('有効なステータス「%s」を受け入れる', (status) => {
      const input = { ...validInput, wp_default_status: status }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('無効なステータスを拒否', () => {
      const input = { ...validInput, wp_default_status: 'invalid' }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_default_status'])
      }
    })

    it('指定なしの場合はdraftがデフォルト', () => {
      const input = {
        company_name: '株式会社テスト',
        wp_base_url: 'https://blog.example.com',
        wp_username: 'admin',
        wp_app_password: 'xxxx xxxx xxxx xxxx',
      }
      const result = companyCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.wp_default_status).toBe('draft')
      }
    })
  })
})

describe('companyUpdateSchema', () => {
  const validInput: CompanyUpdateInput = {
    company_name: '株式会社テスト',
    wp_base_url: 'https://blog.example.com',
    wp_username: 'admin',
    wp_default_status: 'draft',
  }

  it('アプリパスワードなしでも受け入れる（更新時は任意）', () => {
    const result = companyUpdateSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('アプリパスワードが空文字でも受け入れる', () => {
    const input = { ...validInput, wp_app_password: '' }
    const result = companyUpdateSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('アプリパスワードがあれば受け入れる', () => {
    const input = { ...validInput, wp_app_password: 'new-password' }
    const result = companyUpdateSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('必須フィールドは引き続き必須', () => {
    const input = { ...validInput, company_name: '' }
    const result = companyUpdateSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
