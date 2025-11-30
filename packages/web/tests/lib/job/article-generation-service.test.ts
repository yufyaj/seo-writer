// Prismaをモック（jest.mockはホイスティングされるため、直接定義）
jest.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      create: jest.fn(),
      update: jest.fn(),
    },
    jobItem: {
      create: jest.fn(),
      update: jest.fn(),
    },
    postProfile: {
      findUnique: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
  },
}))

// 暗号化をモック
jest.mock('@/lib/crypto/encryption', () => ({
  decrypt: jest.fn((text: string) => `decrypted_${text}`),
}))

// Gemini APIをモック
jest.mock('@/lib/gemini/article-generator', () => ({
  generateArticle: jest.fn(),
  selectKeyword: jest.fn(),
}))

jest.mock('@/lib/gemini/image-generator', () => ({
  generateImage: jest.fn(),
  base64ToBuffer: jest.fn(),
}))

// WordPress APIをモック
const mockWpClient = {
  uploadMedia: jest.fn(),
  createPost: jest.fn(),
  testConnection: jest.fn(),
}

jest.mock('@/lib/wordpress/client', () => ({
  createWordPressClient: jest.fn(() => mockWpClient),
}))

import { ArticleGenerationService } from '@/lib/job/article-generation-service'
import { prisma } from '@/lib/prisma'
import { generateArticle, selectKeyword } from '@/lib/gemini/article-generator'
import { generateImage, base64ToBuffer } from '@/lib/gemini/image-generator'

describe('ArticleGenerationService', () => {
  let service: ArticleGenerationService

  // モック関数の型付き参照
  const mockJobCreate = prisma.job.create as jest.Mock
  const mockJobUpdate = prisma.job.update as jest.Mock
  const mockJobItemCreate = prisma.jobItem.create as jest.Mock
  const mockJobItemUpdate = prisma.jobItem.update as jest.Mock
  const mockPostProfileFindUnique = prisma.postProfile.findUnique as jest.Mock
  const mockCompanyFindUnique = prisma.company.findUnique as jest.Mock
  const mockGenerateArticle = generateArticle as jest.Mock
  const mockSelectKeyword = selectKeyword as jest.Mock
  const mockGenerateImage = generateImage as jest.Mock
  const mockBase64ToBuffer = base64ToBuffer as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ArticleGenerationService()

    // デフォルトのモック設定
    mockJobCreate.mockResolvedValue({ id: BigInt(1) })
    mockJobItemCreate.mockResolvedValue({ id: BigInt(1) })
    mockJobUpdate.mockResolvedValue({})
    mockJobItemUpdate.mockResolvedValue({})

    mockSelectKeyword.mockReturnValue('テストキーワード')
    mockGenerateArticle.mockResolvedValue({
      title: 'テスト記事タイトル',
      content: '<h2>見出し1</h2><p>本文1</p><h2>見出し2</h2><p>本文2</p>',
      meta_description: 'メタディスクリプション',
    })
    mockGenerateImage.mockResolvedValue({
      data: 'base64imagedata',
      mimeType: 'image/png',
    })
    mockBase64ToBuffer.mockReturnValue(Buffer.from('image'))
    mockWpClient.uploadMedia.mockResolvedValue({
      id: 100,
      source_url: 'https://example.com/image.png',
    })
    mockWpClient.createPost.mockResolvedValue({
      id: 200,
      link: 'https://example.com/post/200',
    })
  })

  describe('executeJob', () => {
    const mockPostProfile = {
      id: BigInt(1),
      name: 'テストプロファイル',
      description: 'テスト説明',
      keyword_strategy: { head_middle: ['キーワード1'] },
      wp_category_id: BigInt(5),
      company: {
        company_name: 'テスト会社',
        brand_name: 'テストブランド',
        about_text: '会社概要',
        site_url: 'https://example.com',
        wp_base_url: 'https://blog.example.com',
        wp_username: 'admin',
        wp_app_password: 'encrypted_password',
        wp_default_status: 'draft',
      },
      articleTypes: [
        {
          id: BigInt(10),
          name: 'テスト記事タイプ',
          prompt_template: 'テンプレート',
        },
      ],
    }

    beforeEach(() => {
      mockPostProfileFindUnique.mockResolvedValue(mockPostProfile)
    })

    it('should create job and job item', async () => {
      await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(mockJobCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          post_profile_id: BigInt(1),
          trigger_type: 'manual',
          status: 'running',
        }),
      })

      expect(mockJobItemCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          job_id: BigInt(1),
          post_profile_id: BigInt(1),
          post_profile_article_type_id: BigInt(10),
          status: 'failed',
        }),
      })
    })

    it('should generate article with correct parameters', async () => {
      await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(mockGenerateArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          company: expect.objectContaining({
            companyName: 'テスト会社',
          }),
          profile: expect.objectContaining({
            name: 'テストプロファイル',
          }),
          promptTemplate: 'テンプレート',
        })
      )
    })

    it('should generate images for each H2 tag', async () => {
      await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      // アイキャッチ + H2×2 = 3回
      expect(mockGenerateImage).toHaveBeenCalledTimes(3)
    })

    it('should upload images to WordPress', async () => {
      await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      // アイキャッチ + H2×2 = 3回
      expect(mockWpClient.uploadMedia).toHaveBeenCalledTimes(3)
    })

    it('should create WordPress post with inserted images', async () => {
      await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(mockWpClient.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'テスト記事タイトル',
          status: 'draft',
          categories: [5],
          featured_media: 100,
        })
      )

      // 本文に画像が挿入されていることを確認
      const callArgs = mockWpClient.createPost.mock.calls[0][0]
      expect(callArgs.content).toContain('<figure')
      expect(callArgs.content).toContain('<img')
    })

    it('should return success result', async () => {
      const result = await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(result.success).toBe(true)
      expect(result.jobId).toBe(BigInt(1))
      expect(result.jobItemId).toBe(BigInt(1))
      expect(result.wpPostId).toBe(200)
      expect(result.wpPostUrl).toBe('https://example.com/post/200')
    })

    it('should update job status to success on completion', async () => {
      await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(mockJobUpdate).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: expect.objectContaining({
          status: 'success',
          finished_at: expect.any(Date),
        }),
      })
    })

    it('should handle post profile not found', async () => {
      mockPostProfileFindUnique.mockResolvedValue(null)

      const result = await service.executeJob({
        postProfileId: BigInt(999),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(result.success).toBe(false)
      expect(result.errorMessage).toContain('投稿プロファイルが見つかりません')
    })

    it('should handle article type not found', async () => {
      mockPostProfileFindUnique.mockResolvedValue({
        ...mockPostProfile,
        articleTypes: [],
      })

      const result = await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(999),
        triggerType: 'manual',
      })

      expect(result.success).toBe(false)
      expect(result.errorMessage).toContain('記事タイプが見つかりません')
    })

    it('should handle API error and update job status to failed', async () => {
      mockGenerateArticle.mockRejectedValue(new Error('API Error'))

      const result = await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(result.success).toBe(false)
      expect(result.errorMessage).toBe('API Error')

      expect(mockJobUpdate).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: expect.objectContaining({
          status: 'failed',
          error_message: 'API Error',
        }),
      })
    })

    it('should handle WordPress upload error', async () => {
      mockWpClient.uploadMedia.mockRejectedValue(
        new Error('Upload failed')
      )

      const result = await service.executeJob({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(10),
        triggerType: 'manual',
      })

      expect(result.success).toBe(false)
      expect(result.errorMessage).toBe('Upload failed')
    })
  })

  describe('testWordPressConnection', () => {
    it('should test connection successfully', async () => {
      mockCompanyFindUnique.mockResolvedValue({
        id: BigInt(1),
        wp_base_url: 'https://example.com',
        wp_username: 'admin',
        wp_app_password: 'encrypted',
      })
      mockWpClient.testConnection.mockResolvedValue(true)

      const result = await service.testWordPressConnection(BigInt(1))

      expect(result).toBe(true)
    })

    it('should throw error when company not found', async () => {
      mockCompanyFindUnique.mockResolvedValue(null)

      await expect(
        service.testWordPressConnection(BigInt(999))
      ).rejects.toThrow('会社設定が見つかりません')
    })

    it('should return false when connection fails', async () => {
      mockCompanyFindUnique.mockResolvedValue({
        id: BigInt(1),
        wp_base_url: 'https://example.com',
        wp_username: 'admin',
        wp_app_password: 'encrypted',
      })
      mockWpClient.testConnection.mockResolvedValue(false)

      const result = await service.testWordPressConnection(BigInt(1))

      expect(result).toBe(false)
    })
  })
})
