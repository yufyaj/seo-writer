import Link from 'next/link'
import { auth } from '@/lib/auth/auth'

export default async function HomePage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold">SEO Writer</h1>
        <p className="mt-4 text-gray-600">AI-powered SEO content generation system</p>

        <div className="mt-8 space-x-4">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              ダッシュボード
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
