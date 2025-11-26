import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { getPostProfile } from '@/lib/post-profile/actions'
import { PostProfileForm } from '@/components/post-profile/post-profile-form'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProfilePage({ params }: Props) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const result = await getPostProfile(id)

  if (!result.success || !result.data) {
    notFound()
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
          <h1 className="mb-6 text-2xl font-bold">プロファイル編集</h1>
          <PostProfileForm profile={result.data} />
        </div>
      </div>
    </div>
  )
}
