import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authenticateUser } from './authenticate'
import { loginSchema } from './validation'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // バリデーション
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        // 認証
        const result = await authenticateUser(email, password)

        if (!result.success || !result.user) {
          return null
        }

        // Auth.jsが期待する形式で返す
        return {
          id: result.user.id.toString(),
          email: result.user.email,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間（絶対タイムアウト）
    updateAge: 15 * 60, // 15分ごとにセッションを更新（アイドルタイムアウト）
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true, // JavaScriptからのアクセスを防止（XSS対策）
        sameSite: 'lax', // CSRF対策
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS接続のみ（本番環境）
      },
    },
  },
  // CSRF保護を明示的に有効化（デフォルトで有効だが明示）
  useSecureCookies: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // 型ガードを使用して型安全性を確保
        if (typeof token.id === 'string') {
          session.user.id = token.id
        }
        if (typeof token.email === 'string') {
          session.user.email = token.email
        }
      }
      return session
    },
  },
})
