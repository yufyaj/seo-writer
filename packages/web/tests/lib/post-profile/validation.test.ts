import {
  postProfileCreateSchema,
  postProfileUpdateSchema,
  keywordStrategySchema,
  createEmptyKeywordStrategy,
  type PostProfileCreateInput,
  type PostProfileUpdateInput,
  type KeywordStrategy,
} from '@/lib/post-profile/validation'

describe('keywordStrategySchema', () => {
  it('有効なキーワード戦略を受け入れる', () => {
    const validStrategy: KeywordStrategy = {
      strategy_concept: 'SEO戦略の全体像',
      head_middle: ['キーワード1', 'キーワード2'],
      transactional_cv: ['CV系キーワード'],
      informational_knowhow: ['ノウハウ系'],
      business_specific: ['固有キーワード'],
    }
    const result = keywordStrategySchema.safeParse(validStrategy)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.strategy_concept).toBe('SEO戦略の全体像')
      expect(result.data.head_middle).toHaveLength(2)
    }
  })

  it('空のオブジェクトを受け入れてデフォルト値を設定', () => {
    const result = keywordStrategySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.strategy_concept).toBe('')
      expect(result.data.head_middle).toEqual([])
      expect(result.data.transactional_cv).toEqual([])
      expect(result.data.informational_knowhow).toEqual([])
      expect(result.data.business_specific).toEqual([])
    }
  })

  it('部分的なデータを受け入れてデフォルト値を補完', () => {
    const partialStrategy = {
      strategy_concept: '部分的な戦略',
      head_middle: ['キーワード'],
    }
    const result = keywordStrategySchema.safeParse(partialStrategy)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.strategy_concept).toBe('部分的な戦略')
      expect(result.data.head_middle).toEqual(['キーワード'])
      expect(result.data.transactional_cv).toEqual([])
    }
  })

  it('配列に文字列以外が含まれる場合を拒否', () => {
    const invalidStrategy = {
      head_middle: [123, 'キーワード'],
    }
    const result = keywordStrategySchema.safeParse(invalidStrategy)
    expect(result.success).toBe(false)
  })
})

describe('createEmptyKeywordStrategy', () => {
  it('空のキーワード戦略オブジェクトを生成する', () => {
    const empty = createEmptyKeywordStrategy()
    expect(empty).toEqual({
      strategy_concept: '',
      head_middle: [],
      transactional_cv: [],
      informational_knowhow: [],
      business_specific: [],
    })
  })
})

describe('postProfileCreateSchema', () => {
  const validInput: PostProfileCreateInput = {
    name: 'メインブログ',
    description: 'メインブログ用のプロファイル',
    wp_category_id: 1,
    keyword_strategy: {
      strategy_concept: 'SEO戦略',
      head_middle: ['キーワード1'],
      transactional_cv: [],
      informational_knowhow: [],
      business_specific: [],
    },
    is_active: true,
  }

  it('有効な入力を受け入れる', () => {
    const result = postProfileCreateSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('メインブログ')
      expect(result.data.is_active).toBe(true)
    }
  })

  it('必須フィールドのみでも受け入れる', () => {
    const minimalInput = {
      name: 'プロファイル名',
    }
    const result = postProfileCreateSchema.safeParse(minimalInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('プロファイル名')
      expect(result.data.is_active).toBe(true)
      expect(result.data.keyword_strategy).toEqual(createEmptyKeywordStrategy())
    }
  })

  describe('name', () => {
    it('空文字を拒否', () => {
      const input = { ...validInput, name: '' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name'])
        expect(result.error.issues[0].message).toBe(
          'プロファイル名を入力してください'
        )
      }
    })

    it('255文字を超える場合を拒否', () => {
      const input = { ...validInput, name: 'a'.repeat(256) }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name'])
        expect(result.error.issues[0].message).toBe(
          'プロファイル名は255文字以内で入力してください'
        )
      }
    })

    it('255文字ちょうどは受け入れる', () => {
      const input = { ...validInput, name: 'a'.repeat(255) }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('description', () => {
    it('空文字を許可', () => {
      const input = { ...validInput, description: '' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('undefinedを許可', () => {
      const input = { name: 'プロファイル名' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('長いテキストを受け入れる', () => {
      const input = { ...validInput, description: 'a'.repeat(10000) }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('wp_category_id', () => {
    it('正の整数を受け入れる', () => {
      const input = { ...validInput, wp_category_id: 123 }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('nullを許可', () => {
      const input = { ...validInput, wp_category_id: null }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('undefinedを許可', () => {
      const input = { name: 'プロファイル名' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('0を拒否（正の整数のみ）', () => {
      const input = { ...validInput, wp_category_id: 0 }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_category_id'])
      }
    })

    it('負の数を拒否', () => {
      const input = { ...validInput, wp_category_id: -1 }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_category_id'])
      }
    })

    it('小数を拒否', () => {
      const input = { ...validInput, wp_category_id: 1.5 }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['wp_category_id'])
      }
    })
  })

  describe('keyword_strategy', () => {
    it('有効なキーワード戦略を受け入れる', () => {
      const input = {
        ...validInput,
        keyword_strategy: {
          strategy_concept: '戦略コンセプト',
          head_middle: ['キーワードA', 'キーワードB'],
          transactional_cv: ['CV1'],
          informational_knowhow: ['ノウハウ1'],
          business_specific: ['固有1'],
        },
      }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('空のオブジェクトを受け入れてデフォルト値を設定', () => {
      const input = { ...validInput, keyword_strategy: {} }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.keyword_strategy.strategy_concept).toBe('')
        expect(result.data.keyword_strategy.head_middle).toEqual([])
      }
    })

    it('undefinedの場合はデフォルトの空の戦略を設定', () => {
      const input = { name: 'プロファイル名' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.keyword_strategy).toEqual(createEmptyKeywordStrategy())
      }
    })
  })

  describe('is_active', () => {
    it('trueを受け入れる', () => {
      const input = { ...validInput, is_active: true }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('falseを受け入れる', () => {
      const input = { ...validInput, is_active: false }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(false)
      }
    })

    it('undefinedの場合はtrueがデフォルト', () => {
      const input = { name: 'プロファイル名' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('文字列を拒否', () => {
      const input = { ...validInput, is_active: 'true' }
      const result = postProfileCreateSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('postProfileUpdateSchema', () => {
  const validInput: PostProfileUpdateInput = {
    id: '1',
    name: 'メインブログ',
    description: 'メインブログ用のプロファイル',
    wp_category_id: 1,
    keyword_strategy: {
      strategy_concept: 'SEO戦略',
      head_middle: ['キーワード1'],
      transactional_cv: [],
      informational_knowhow: [],
      business_specific: [],
    },
    is_active: true,
  }

  it('有効な入力を受け入れる', () => {
    const result = postProfileUpdateSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('1')
      expect(result.data.name).toBe('メインブログ')
    }
  })

  it('idが空文字の場合を拒否', () => {
    const input = { ...validInput, id: '' }
    const result = postProfileUpdateSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
      expect(result.error.issues[0].message).toBe('プロファイルIDが必要です')
    }
  })

  it('idがない場合を拒否', () => {
    const { id: _, ...inputWithoutId } = validInput
    const result = postProfileUpdateSchema.safeParse(inputWithoutId)
    expect(result.success).toBe(false)
  })

  it('nameが空文字の場合を拒否（createと同じバリデーション）', () => {
    const input = { ...validInput, name: '' }
    const result = postProfileUpdateSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
