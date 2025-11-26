import {
  articleTypeCreateSchema,
  articleTypeUpdateSchema,
  type ArticleTypeCreateInput,
  type ArticleTypeUpdateInput,
} from '@/lib/article-type/validation'

describe('articleTypeCreateSchema', () => {
  const validInput: ArticleTypeCreateInput = {
    post_profile_id: '1',
    name: 'AIのよくある失敗5選',
    description: '失敗事例をまとめた記事タイプ',
    prompt_template: `
以下の構成で記事を作成してください：
1. 導入（読者の課題に共感）
2. 失敗事例1〜5（各事例の説明と対策）
3. まとめ（行動を促す）
    `.trim(),
    is_enabled: true,
  }

  it('有効な入力を受け入れる', () => {
    const result = articleTypeCreateSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('AIのよくある失敗5選')
      expect(result.data.is_enabled).toBe(true)
    }
  })

  it('必須フィールドのみでも受け入れる', () => {
    const minimalInput = {
      post_profile_id: '1',
      name: '記事タイプ名',
      prompt_template: 'テンプレート内容',
    }
    const result = articleTypeCreateSchema.safeParse(minimalInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_enabled).toBe(true)
    }
  })

  describe('post_profile_id', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, post_profile_id: '' }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['post_profile_id'])
        expect(result.error.issues[0].message).toBe('プロファイルIDが必要です')
      }
    })
  })

  describe('name', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, name: '' }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name'])
        expect(result.error.issues[0].message).toBe(
          '記事タイプ名を入力してください'
        )
      }
    })

    it('255文字を超える場合を拒否', () => {
      const input = { ...validInput, name: 'a'.repeat(256) }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name'])
        expect(result.error.issues[0].message).toBe(
          '記事タイプ名は255文字以内で入力してください'
        )
      }
    })

    it('255文字ちょうどは受け入れる', () => {
      const input = { ...validInput, name: 'a'.repeat(255) }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('description', () => {
    it('空文字を許可', () => {
      const input = { ...validInput, description: '' }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('undefinedを許可', () => {
      const input = {
        post_profile_id: '1',
        name: '記事タイプ名',
        prompt_template: 'テンプレート',
      }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('長いテキストを受け入れる', () => {
      const input = { ...validInput, description: 'a'.repeat(10000) }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('prompt_template', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, prompt_template: '' }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['prompt_template'])
        expect(result.error.issues[0].message).toBe(
          'プロンプトテンプレートを入力してください'
        )
      }
    })

    it('長いテキストを受け入れる（LLMプロンプト用）', () => {
      const input = { ...validInput, prompt_template: 'a'.repeat(50000) }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('改行を含むテキストを受け入れる', () => {
      const input = {
        ...validInput,
        prompt_template: `
## 構成
1. 導入
2. 本文
3. まとめ

## 制約
- 3000文字以上
- 専門用語は解説を入れる
        `.trim(),
      }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('is_enabled', () => {
    it('trueを受け入れる', () => {
      const input = { ...validInput, is_enabled: true }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_enabled).toBe(true)
      }
    })

    it('falseを受け入れる', () => {
      const input = { ...validInput, is_enabled: false }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_enabled).toBe(false)
      }
    })

    it('undefinedの場合はtrueがデフォルト', () => {
      const input = {
        post_profile_id: '1',
        name: '記事タイプ名',
        prompt_template: 'テンプレート',
      }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_enabled).toBe(true)
      }
    })

    it('文字列を拒否', () => {
      const input = { ...validInput, is_enabled: 'true' }
      const result = articleTypeCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('articleTypeUpdateSchema', () => {
  const validInput: ArticleTypeUpdateInput = {
    id: '1',
    name: 'AIのよくある失敗5選',
    description: '失敗事例をまとめた記事タイプ',
    prompt_template: 'テンプレート内容',
    is_enabled: true,
  }

  it('有効な入力を受け入れる', () => {
    const result = articleTypeUpdateSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('1')
      expect(result.data.name).toBe('AIのよくある失敗5選')
    }
  })

  it('idが空文字の場合を拒否', () => {
    const input = { ...validInput, id: '' }
    const result = articleTypeUpdateSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
      expect(result.error.issues[0].message).toBe('記事タイプIDが必要です')
    }
  })

  it('idがない場合を拒否', () => {
    const { id: _, ...inputWithoutId } = validInput
    const result = articleTypeUpdateSchema.safeParse(inputWithoutId)
    expect(result.success).toBe(false)
  })

  it('nameが空文字の場合を拒否（createと同じバリデーション）', () => {
    const input = { ...validInput, name: '' }
    const result = articleTypeUpdateSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('prompt_templateが空文字の場合を拒否', () => {
    const input = { ...validInput, prompt_template: '' }
    const result = articleTypeUpdateSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
