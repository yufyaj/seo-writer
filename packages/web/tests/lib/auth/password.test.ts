import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('hashPassword', () => {
  it('パスワードをハッシュ化できる', async () => {
    const password = 'password123'
    const hashed = await hashPassword(password)

    expect(hashed).not.toBe(password)
    expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/)
  })

  it('同じパスワードでも異なるハッシュを生成する（ソルト）', async () => {
    const password = 'password123'
    const hashed1 = await hashPassword(password)
    const hashed2 = await hashPassword(password)

    expect(hashed1).not.toBe(hashed2)
  })
})

describe('verifyPassword', () => {
  it('正しいパスワードを検証できる', async () => {
    const password = 'password123'
    const hashed = await hashPassword(password)
    const result = await verifyPassword(password, hashed)

    expect(result).toBe(true)
  })

  it('間違ったパスワードは拒否される', async () => {
    const password = 'password123'
    const hashed = await hashPassword(password)
    const result = await verifyPassword('wrongpassword', hashed)

    expect(result).toBe(false)
  })

  it('空文字列のパスワードも正しく処理される', async () => {
    const password = ''
    const hashed = await hashPassword(password)
    const result = await verifyPassword('', hashed)

    expect(result).toBe(true)
  })
})
