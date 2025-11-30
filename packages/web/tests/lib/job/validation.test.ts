import {
  jobCreateSchema,
  jobItemCreateSchema,
  generateArticleRequestSchema,
  generatedArticleSchema,
  triggerTypes,
  jobStatuses,
  jobItemStatuses,
} from '@/lib/job/validation'

describe('Job Validation', () => {
  describe('triggerTypes', () => {
    it('should have manual and scheduler types', () => {
      expect(triggerTypes).toContain('manual')
      expect(triggerTypes).toContain('scheduler')
    })
  })

  describe('jobStatuses', () => {
    it('should have all status types', () => {
      expect(jobStatuses).toContain('running')
      expect(jobStatuses).toContain('success')
      expect(jobStatuses).toContain('partial_failed')
      expect(jobStatuses).toContain('failed')
    })
  })

  describe('jobItemStatuses', () => {
    it('should have success and failed statuses', () => {
      expect(jobItemStatuses).toContain('success')
      expect(jobItemStatuses).toContain('failed')
    })
  })

  describe('jobCreateSchema', () => {
    it('should validate valid input', () => {
      const result = jobCreateSchema.safeParse({
        post_profile_id: '1',
        trigger_type: 'manual',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty post_profile_id', () => {
      const result = jobCreateSchema.safeParse({
        post_profile_id: '',
        trigger_type: 'manual',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid trigger_type', () => {
      const result = jobCreateSchema.safeParse({
        post_profile_id: '1',
        trigger_type: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should accept scheduler trigger_type', () => {
      const result = jobCreateSchema.safeParse({
        post_profile_id: '1',
        trigger_type: 'scheduler',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('jobItemCreateSchema', () => {
    it('should validate valid success item', () => {
      const result = jobItemCreateSchema.safeParse({
        job_id: '1',
        post_profile_id: '1',
        post_profile_article_type_id: '1',
        keyword: 'AI開発',
        title: 'AI開発入門',
        wp_post_id: 123,
        wp_post_url: 'https://example.com/ai-development',
        wp_media_id: 456,
        status: 'success',
      })
      expect(result.success).toBe(true)
    })

    it('should validate valid failed item', () => {
      const result = jobItemCreateSchema.safeParse({
        job_id: '1',
        post_profile_id: '1',
        post_profile_article_type_id: '1',
        status: 'failed',
        error_message: 'API error',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty job_id', () => {
      const result = jobItemCreateSchema.safeParse({
        job_id: '',
        post_profile_id: '1',
        post_profile_article_type_id: '1',
        status: 'success',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = jobItemCreateSchema.safeParse({
        job_id: '1',
        post_profile_id: '1',
        post_profile_article_type_id: '1',
        status: 'running',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid URL', () => {
      const result = jobItemCreateSchema.safeParse({
        job_id: '1',
        post_profile_id: '1',
        post_profile_article_type_id: '1',
        wp_post_url: 'not-a-url',
        status: 'success',
      })
      expect(result.success).toBe(false)
    })

    it('should allow null optional fields', () => {
      const result = jobItemCreateSchema.safeParse({
        job_id: '1',
        post_profile_id: '1',
        post_profile_article_type_id: '1',
        keyword: null,
        title: null,
        wp_post_id: null,
        wp_post_url: null,
        wp_media_id: null,
        status: 'success',
        error_message: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('generateArticleRequestSchema', () => {
    it('should validate valid request', () => {
      const result = generateArticleRequestSchema.safeParse({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(1),
        triggerType: 'manual',
      })
      expect(result.success).toBe(true)
    })

    it('should validate request with string coercion', () => {
      const result = generateArticleRequestSchema.safeParse({
        postProfileId: '1',
        articleTypeId: '2',
        triggerType: 'scheduler',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid trigger type', () => {
      const result = generateArticleRequestSchema.safeParse({
        postProfileId: BigInt(1),
        articleTypeId: BigInt(1),
        triggerType: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('generatedArticleSchema', () => {
    it('should validate valid article', () => {
      const result = generatedArticleSchema.safeParse({
        title: 'AI開発入門',
        content: '<p>AI開発について解説します。</p>',
        meta_description: 'AI開発の基礎を学びましょう',
        excerpt: 'AI開発の入門記事',
      })
      expect(result.success).toBe(true)
    })

    it('should validate article without optional fields', () => {
      const result = generatedArticleSchema.safeParse({
        title: 'AI開発入門',
        content: '<p>AI開発について解説します。</p>',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = generatedArticleSchema.safeParse({
        title: '',
        content: '<p>Content</p>',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty content', () => {
      const result = generatedArticleSchema.safeParse({
        title: 'Title',
        content: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing title', () => {
      const result = generatedArticleSchema.safeParse({
        content: '<p>Content</p>',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing content', () => {
      const result = generatedArticleSchema.safeParse({
        title: 'Title',
      })
      expect(result.success).toBe(false)
    })
  })
})
