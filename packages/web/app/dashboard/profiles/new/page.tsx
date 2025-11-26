import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { PostProfileForm } from '@/components/post-profile/post-profile-form'
import Link from 'next/link'

export default async function NewProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard/profiles"
            className="text-sm text-blue-600 hover:underline"
          >
            ← プロファイル一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold">新規プロファイル作成</h1>
          <PostProfileForm />
        </div>
      </div>
    </div>
  )
}
