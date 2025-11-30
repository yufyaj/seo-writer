import {
  buildImagePrompt,
  base64ToBuffer,
  type ImageGenerationParams,
} from '@/lib/gemini/image-generator'

// Gemini APIをモック
jest.mock('@/lib/gemini/client', () => ({
  getGeminiClient: jest.fn(),
  IMAGE_MODEL: 'gemini-2.5-flash-image',
  withRetry: jest.fn((fn) => fn()),
}))

describe('Image Generator', () => {
  describe('buildImagePrompt', () => {
    const baseParams: ImageGenerationParams = {
      title: '記事タイトル',
      content: '<p>記事の本文です。</p><p>HTMLタグが含まれています。</p>',
      keyword: 'キーワード',
    }

    it('should include title in prompt', () => {
      const prompt = buildImagePrompt(baseParams)
      expect(prompt).toContain('記事タイトル')
    })

    it('should include keyword in prompt when provided', () => {
      const prompt = buildImagePrompt(baseParams)
      expect(prompt).toContain('キーワード')
    })

    it('should strip HTML tags from content', () => {
      const prompt = buildImagePrompt(baseParams)
      expect(prompt).not.toContain('<p>')
      expect(prompt).not.toContain('</p>')
      expect(prompt).toContain('記事の本文です')
    })

    it('should handle content without keyword', () => {
      const paramsNoKeyword: ImageGenerationParams = {
        title: 'タイトル',
        content: '本文',
      }

      const prompt = buildImagePrompt(paramsNoKeyword)
      expect(prompt).toContain('タイトル')
      expect(prompt).not.toContain('キーワード:')
    })

    it('should truncate long content', () => {
      const longContent = '<p>' + 'あ'.repeat(500) + '</p>'
      const params: ImageGenerationParams = {
        title: 'タイトル',
        content: longContent,
      }

      const prompt = buildImagePrompt(params)
      // 200文字程度に切り詰められることを確認
      expect(prompt.length).toBeLessThan(longContent.length)
    })

    it('should include design requirements', () => {
      const prompt = buildImagePrompt(baseParams)
      expect(prompt).toContain('モダン')
      expect(prompt).toContain('プロフェッショナル')
    })

    it('should include aspect ratio requirement', () => {
      const prompt = buildImagePrompt(baseParams)
      expect(prompt).toContain('16:9')
    })

    it('should specify no text in image', () => {
      const prompt = buildImagePrompt(baseParams)
      expect(prompt).toContain('テキストは含めない')
    })

    it('should handle complex HTML content', () => {
      const complexContent = `
        <h2>見出し</h2>
        <p>段落1</p>
        <ul>
          <li>リスト1</li>
          <li>リスト2</li>
        </ul>
        <blockquote>引用文</blockquote>
      `
      const params: ImageGenerationParams = {
        title: 'タイトル',
        content: complexContent,
      }

      const prompt = buildImagePrompt(params)
      expect(prompt).not.toContain('<h2>')
      expect(prompt).not.toContain('<ul>')
      expect(prompt).not.toContain('<li>')
      expect(prompt).toContain('見出し')
    })

    it('should normalize whitespace', () => {
      const contentWithWhitespace = '<p>  複数の   スペース  </p>'
      const params: ImageGenerationParams = {
        title: 'タイトル',
        content: contentWithWhitespace,
      }

      const prompt = buildImagePrompt(params)
      expect(prompt).not.toContain('   ')
    })
  })

  describe('base64ToBuffer', () => {
    it('should convert base64 string to Buffer', () => {
      const originalText = 'Hello, World!'
      const base64 = Buffer.from(originalText).toString('base64')

      const buffer = base64ToBuffer(base64)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.toString()).toBe(originalText)
    })

    it('should handle empty base64', () => {
      const buffer = base64ToBuffer('')
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBe(0)
    })

    it('should handle binary data', () => {
      // PNGヘッダーの模擬
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const base64 = Buffer.from(binaryData).toString('base64')

      const buffer = base64ToBuffer(base64)

      expect(buffer[0]).toBe(0x89)
      expect(buffer[1]).toBe(0x50)
      expect(buffer[2]).toBe(0x4e)
      expect(buffer[3]).toBe(0x47)
    })

    it('should handle Japanese text', () => {
      const japaneseText = 'こんにちは'
      const base64 = Buffer.from(japaneseText).toString('base64')

      const buffer = base64ToBuffer(base64)

      expect(buffer.toString('utf-8')).toBe(japaneseText)
    })

    it('should handle large data', () => {
      const largeData = 'x'.repeat(100000)
      const base64 = Buffer.from(largeData).toString('base64')

      const buffer = base64ToBuffer(base64)

      expect(buffer.toString()).toBe(largeData)
    })

    it('should handle data URL format (without prefix)', () => {
      // data:image/png;base64, プレフィックスなしのBase64
      const text = 'test'
      const base64 = Buffer.from(text).toString('base64')

      const buffer = base64ToBuffer(base64)

      expect(buffer.toString()).toBe(text)
    })
  })
})
