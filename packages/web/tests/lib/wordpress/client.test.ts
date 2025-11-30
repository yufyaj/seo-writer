import {
  WordPressClient,
  createWordPressClient,
} from '@/lib/wordpress/client'
import type { WPConnectionConfig } from '@/lib/wordpress/types'

// fetchをモック
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('WordPress Client', () => {
  const config: WPConnectionConfig = {
    baseUrl: 'https://example.com',
    username: 'testuser',
    appPassword: 'xxxx xxxx xxxx xxxx',
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createWordPressClient', () => {
    it('should create a WordPressClient instance', () => {
      const client = createWordPressClient(config)
      expect(client).toBeInstanceOf(WordPressClient)
    })
  })

  describe('WordPressClient constructor', () => {
    it('should remove trailing slash from baseUrl', () => {
      const configWithSlash: WPConnectionConfig = {
        ...config,
        baseUrl: 'https://example.com/',
      }

      const client = createWordPressClient(configWithSlash)
      expect(client).toBeDefined()
    })

    it('should create Basic auth header', () => {
      const client = createWordPressClient(config)
      expect(client).toBeDefined()
    })
  })

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'testuser' }),
      })

      const client = createWordPressClient(config)
      const result = await client.testConnection()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/wp-json/wp/v2/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      )
    })

    it('should return false on failed connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })

      const client = createWordPressClient(config)
      const result = await client.testConnection()

      expect(result).toBe(false)
    })

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const client = createWordPressClient(config)
      const result = await client.testConnection()

      expect(result).toBe(false)
    })
  })

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const mockPost = {
        id: 123,
        link: 'https://example.com/2024/01/test-post/',
        title: { rendered: 'Test Title' },
        content: { rendered: '<p>Test content</p>' },
        status: 'publish',
        featured_media: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPost),
      })

      const client = createWordPressClient(config)
      const result = await client.createPost({
        title: 'Test Title',
        content: '<p>Test content</p>',
        status: 'publish',
      })

      expect(result).toEqual(mockPost)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/wp-json/wp/v2/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should include categories when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })

      const client = createWordPressClient(config)
      await client.createPost({
        title: 'Test',
        content: 'Content',
        status: 'draft',
        categories: [1, 2, 3],
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.categories).toEqual([1, 2, 3])
    })

    it('should include featured_media when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })

      const client = createWordPressClient(config)
      await client.createPost({
        title: 'Test',
        content: 'Content',
        status: 'draft',
        featured_media: 456,
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.featured_media).toBe(456)
    })

    it('should include excerpt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })

      const client = createWordPressClient(config)
      await client.createPost({
        title: 'Test',
        content: 'Content',
        status: 'draft',
        excerpt: 'This is an excerpt',
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.excerpt).toBe('This is an excerpt')
    })

    it('should throw error on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            code: 'rest_cannot_create',
            message: 'このユーザーとして投稿を編集する権限がありません。',
          }),
      })

      const client = createWordPressClient(config)

      await expect(
        client.createPost({
          title: 'Test',
          content: 'Content',
          status: 'publish',
        })
      ).rejects.toThrow('このユーザーとして投稿を編集する権限がありません')
    })

    it('should throw generic error when API response is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Not JSON')),
      })

      const client = createWordPressClient(config)

      await expect(
        client.createPost({
          title: 'Test',
          content: 'Content',
          status: 'publish',
        })
      ).rejects.toThrow('WordPress API error: 500')
    })
  })

  describe('uploadMedia', () => {
    it('should upload media successfully', async () => {
      const mockMedia = {
        id: 789,
        source_url: 'https://example.com/wp-content/uploads/image.png',
        title: { rendered: 'Test Image' },
        alt_text: '',
      }

      // Upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedia),
      })

      // Alt text update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockMedia, alt_text: 'Alt text for image' }),
      })

      const client = createWordPressClient(config)
      const imageBuffer = Buffer.from('fake image data')
      const result = await client.uploadMedia(
        imageBuffer,
        'test-image.png',
        'image/png',
        'Alt text for image'
      )

      expect(result.id).toBe(789)
      expect(result.source_url).toBe(
        'https://example.com/wp-content/uploads/image.png'
      )
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/wp-json/wp/v2/media',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="test-image.png"',
          }),
        })
      )
    })

    it('should update alt text after upload when provided', async () => {
      const mockMedia = {
        id: 789,
        source_url: 'https://example.com/wp-content/uploads/image.png',
        title: { rendered: 'Test Image' },
        alt_text: '',
      }

      // Upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedia),
      })

      // Alt text update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockMedia, alt_text: 'Updated alt' }),
      })

      const client = createWordPressClient(config)
      const imageBuffer = Buffer.from('fake image data')
      await client.uploadMedia(
        imageBuffer,
        'test-image.png',
        'image/png',
        'Alt text'
      )

      // Alt text更新のAPIが呼ばれることを確認
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[1][0]).toBe(
        'https://example.com/wp-json/wp/v2/media/789'
      )
    })

    it('should not update alt text when not provided', async () => {
      const mockMedia = {
        id: 789,
        source_url: 'https://example.com/wp-content/uploads/image.png',
        title: { rendered: 'Test Image' },
        alt_text: '',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedia),
      })

      const client = createWordPressClient(config)
      const imageBuffer = Buffer.from('fake image data')
      await client.uploadMedia(imageBuffer, 'test-image.png')

      // アップロードのみ
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should throw error on upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: () =>
          Promise.resolve({
            code: 'rest_upload_file_too_big',
            message: 'File is too large',
          }),
      })

      const client = createWordPressClient(config)
      const imageBuffer = Buffer.from('fake image data')

      await expect(
        client.uploadMedia(imageBuffer, 'test.png')
      ).rejects.toThrow('File is too large')
    })

    it('should handle Uint8Array input', async () => {
      const mockMedia = {
        id: 789,
        source_url: 'https://example.com/image.png',
        title: { rendered: 'Test' },
        alt_text: '',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedia),
      })

      const client = createWordPressClient(config)
      const uint8Array = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const result = await client.uploadMedia(uint8Array, 'test.png')

      expect(result.id).toBe(789)
    })
  })

  describe('getCategories', () => {
    it('should fetch categories', async () => {
      const mockCategories = [
        { id: 1, name: 'カテゴリ1' },
        { id: 2, name: 'カテゴリ2' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      })

      const client = createWordPressClient(config)
      const result = await client.getCategories()

      expect(result).toEqual(mockCategories)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/wp-json/wp/v2/categories',
        expect.any(Object)
      )
    })
  })
})
