import {
  selectKeyword,
  buildArticlePrompt,
  type ArticleGenerationParams,
} from '@/lib/gemini/article-generator'

// Gemini APIをモック
jest.mock('@/lib/gemini/client', () => ({
  getGeminiClient: jest.fn(),
  TEXT_MODEL: 'gemini-2.0-flash',
  withRetry: jest.fn((fn) => fn()),
}))

describe('Article Generator', () => {
  describe('selectKeyword', () => {
    it('should return null for empty keyword strategy', () => {
      const result = selectKeyword({})
      expect(result).toBeNull()
    })

    it('should return null when all arrays are empty', () => {
      const result = selectKeyword({
        head_middle: [],
        transactional_cv: [],
        informational_knowhow: [],
        business_specific: [],
      })
      expect(result).toBeNull()
    })

    it('should select from head_middle keywords', () => {
      const keywords = ['キーワード1', 'キーワード2', 'キーワード3']
      const result = selectKeyword({ head_middle: keywords })

      expect(result).not.toBeNull()
      expect(keywords).toContain(result)
    })

    it('should select from transactional_cv keywords', () => {
      const keywords = ['CV1', 'CV2']
      const result = selectKeyword({ transactional_cv: keywords })

      expect(result).not.toBeNull()
      expect(keywords).toContain(result)
    })

    it('should select from informational_knowhow keywords', () => {
      const keywords = ['ノウハウ1', 'ノウハウ2']
      const result = selectKeyword({ informational_knowhow: keywords })

      expect(result).not.toBeNull()
      expect(keywords).toContain(result)
    })

    it('should select from business_specific keywords', () => {
      const keywords = ['ビジネス1', 'ビジネス2']
      const result = selectKeyword({ business_specific: keywords })

      expect(result).not.toBeNull()
      expect(keywords).toContain(result)
    })

    it('should select from combined keywords', () => {
      const allKeywords = ['HM1', 'TV1', 'IK1', 'BS1']
      const result = selectKeyword({
        head_middle: ['HM1'],
        transactional_cv: ['TV1'],
        informational_knowhow: ['IK1'],
        business_specific: ['BS1'],
      })

      expect(result).not.toBeNull()
      expect(allKeywords).toContain(result)
    })

    it('should return different keywords (randomness)', () => {
      const keywords = {
        head_middle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      }

      // 複数回実行して異なる結果が出ることを確認
      const results = new Set<string | null>()
      for (let i = 0; i < 50; i++) {
        results.add(selectKeyword(keywords))
      }

      // 少なくとも2種類以上の結果があることを期待
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('buildArticlePrompt', () => {
    const baseParams: ArticleGenerationParams = {
      company: {
        companyName: 'テスト株式会社',
        brandName: 'TestBrand',
        aboutText: '会社紹介テキスト',
        siteUrl: 'https://example.com',
      },
      profile: {
        name: 'テストプロファイル',
        description: 'プロファイル説明',
      },
      keywordStrategy: {
        strategy_concept: 'SEO戦略コンセプト',
        head_middle: ['キーワード1'],
      },
      keyword: 'ターゲットキーワード',
      promptTemplate: '## 記事構成\n1. 導入\n2. 本文\n3. まとめ',
    }

    it('should include company name in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('テスト株式会社')
    })

    it('should include brand name in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('TestBrand')
    })

    it('should include about text in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('会社紹介テキスト')
    })

    it('should include site URL in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('https://example.com')
    })

    it('should include profile name in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('テストプロファイル')
    })

    it('should include profile description in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('プロファイル説明')
    })

    it('should include keyword in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('ターゲットキーワード')
    })

    it('should include strategy concept in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('SEO戦略コンセプト')
    })

    it('should include prompt template in prompt', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('## 記事構成')
      expect(prompt).toContain('1. 導入')
    })

    it('should include JSON output format instructions', () => {
      const prompt = buildArticlePrompt(baseParams)
      expect(prompt).toContain('"title"')
      expect(prompt).toContain('"content"')
      expect(prompt).toContain('"meta_description"')
    })

    it('should handle missing optional fields', () => {
      const minimalParams: ArticleGenerationParams = {
        company: {
          companyName: '最小会社',
        },
        profile: {
          name: '最小プロファイル',
        },
        keywordStrategy: {},
        keyword: 'キーワード',
        promptTemplate: 'テンプレート',
      }

      const prompt = buildArticlePrompt(minimalParams)
      expect(prompt).toContain('最小会社')
      expect(prompt).toContain('最小プロファイル')
      expect(prompt).toContain('キーワード')
    })

    it('should handle null optional fields', () => {
      const paramsWithNull: ArticleGenerationParams = {
        company: {
          companyName: 'テスト会社',
          brandName: null,
          aboutText: null,
          siteUrl: null,
        },
        profile: {
          name: 'プロファイル',
          description: null,
        },
        keywordStrategy: {},
        keyword: 'キーワード',
        promptTemplate: 'テンプレート',
      }

      expect(() => buildArticlePrompt(paramsWithNull)).not.toThrow()
    })
  })
})
