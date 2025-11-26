import { loginSchema, type LoginInput } from '@/lib/auth/validation'

describe('loginSchema', () => {
  it('有効なメールアドレスとパスワードを受け入れる', () => {
    const validInput: LoginInput = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = loginSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('メールアドレスが必須', () => {
    const invalidInput = {
      password: 'password123',
    }

    const result = loginSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email'])
    }
  })

  it('無効なメールアドレス形式を拒否', () => {
    const invalidInput = {
      email: 'invalid-email',
      password: 'password123',
    }

    const result = loginSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email'])
    }
  })

  it('パスワードが必須', () => {
    const invalidInput = {
      email: 'test@example.com',
    }

    const result = loginSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['password'])
    }
  })

  it('パスワードは最低8文字必要', () => {
    const invalidInput = {
      email: 'test@example.com',
      password: 'short',
    }

    const result = loginSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['password'])
    }
  })

  it('空文字列のメールアドレスを拒否', () => {
    const invalidInput = {
      email: '',
      password: 'password123',
    }

    const result = loginSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email'])
    }
  })

  it('空文字列のパスワードを拒否', () => {
    const invalidInput = {
      email: 'test@example.com',
      password: '',
    }

    const result = loginSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['password'])
    }
  })
})
