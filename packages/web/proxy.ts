import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { nextUrl } = request
  const isLoggedIn = !!session?.user

  // 保護されたルート（ログインが必要）
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  // ログインページ
  const isLoginPage = nextUrl.pathname === '/login'

  // 未ログインユーザーが保護されたページにアクセスしようとした場合
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // ログイン済みユーザーがログインページにアクセスしようとした場合
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
