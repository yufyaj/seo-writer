'use server'

import { signIn, signOut } from './auth'
import { loginSchema } from './validation'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export type LoginResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * ログイン処理
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  // バリデーション
  const validatedFields = loginSchema.safeParse({ email, password })

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    await signIn('credentials', {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'メールアドレスまたはパスワードが正しくありません',
          }
        default:
          return {
            success: false,
            error: 'ログインに失敗しました',
          }
      }
    }
    throw error
  }
}

/**
 * ログアウト処理
 */
export async function logout() {
  await signOut({ redirect: false })
  redirect('/login')
}
