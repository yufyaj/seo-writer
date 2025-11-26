import { prisma } from '@/lib/prisma'
import { verifyPassword } from './password'

export type AuthResult = {
  success: boolean
  user?: {
    id: bigint
    email: string
  }
  error?: string
}

/**
 * ユーザー認証を行う
 * @param email - メールアドレス
 * @param password - パスワード
 * @returns 認証結果
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  // 入力チェック
  if (!email || !password) {
    return {
      success: false,
      error: 'メールアドレスとパスワードを入力してください',
    }
  }

  // ユーザーを検索
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // ユーザーが存在しない
  if (!user) {
    return {
      success: false,
      error: 'メールアドレスまたはパスワードが正しくありません',
    }
  }

  // パスワードを検証
  const isPasswordValid = await verifyPassword(password, user.password_hash)

  if (!isPasswordValid) {
    return {
      success: false,
      error: 'メールアドレスまたはパスワードが正しくありません',
    }
  }

  // 認証成功
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
  }
}
