/**
 * @jest-environment node
 */
import { authenticateUser } from '@/lib/auth/authenticate'
import { hashPassword } from '@/lib/auth/password'
import { PrismaClient } from '@prisma/client'
import createPrismaMock from 'prisma-mock'

// Prismockのセットアップ
let prismock: PrismaClient

// lib/prismaをモック
jest.mock('@/lib/prisma', () => ({
  get prisma() {
    return prismock
  },
}))

describe('authenticateUser', () => {
  beforeEach(async () => {
    // 各テストの前に新しいPrisma Mockインスタンスを作成
    prismock = await createPrismaMock()
  })

  it('正しいメールアドレスとパスワードでログインできる', async () => {
    // テスト用のユーザーを作成
    const hashedPassword = await hashPassword('password123')
    await prismock.user.create({
      data: {
        email: 'test@example.com',
        password_hash: hashedPassword,
      },
    })

    const result = await authenticateUser('test@example.com', 'password123')

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
    expect(result.user?.email).toBe('test@example.com')
  })

  it('存在しないメールアドレスではログインできない', async () => {
    const result = await authenticateUser('nonexistent@example.com', 'password123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('メールアドレスまたはパスワードが正しくありません')
    expect(result.user).toBeUndefined()
  })

  it('間違ったパスワードではログインできない', async () => {
    // テスト用のユーザーを作成
    const hashedPassword = await hashPassword('password123')
    await prismock.user.create({
      data: {
        email: 'test@example.com',
        password_hash: hashedPassword,
      },
    })

    const result = await authenticateUser('test@example.com', 'wrongpassword')

    expect(result.success).toBe(false)
    expect(result.error).toBe('メールアドレスまたはパスワードが正しくありません')
    expect(result.user).toBeUndefined()
  })

  it('空のメールアドレスではログインできない', async () => {
    const result = await authenticateUser('', 'password123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('メールアドレスとパスワードを入力してください')
    expect(result.user).toBeUndefined()
  })

  it('空のパスワードではログインできない', async () => {
    const result = await authenticateUser('test@example.com', '')

    expect(result.success).toBe(false)
    expect(result.error).toBe('メールアドレスとパスワードを入力してください')
    expect(result.user).toBeUndefined()
  })
})
