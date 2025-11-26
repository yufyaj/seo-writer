import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { getPostProfile } from '@/lib/post-profile/actions'
import { getArticleTypes } from '@/lib/article-type/actions'
import { ArticleTypeList } from '@/components/article-type/article-type-list'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ArticleTypesPage({ params }: Props) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id: profileId } = await params

  // プロファイルの存在確認
  const profileResult = await getPostProfile(profileId)
  if (!profileResult.success || !profileResult.data) {
    notFound()
  }

  const result = await getArticleTypes(profileId)

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-red-600">{result.error}</p>
            <Link
              href="/dashboard/profiles"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              プロファイル一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard/profiles"
            className="text-sm text-blue-600 hover:underline"
          >
            ← プロファイル一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">記事タイプ</h1>
              <p className="mt-1 text-sm text-gray-500">
                プロファイル: {profileResult.data.name}
              </p>
            </div>
            <Link
              href={`/dashboard/profiles/${profileId}/article-types/new`}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              新規作成
            </Link>
          </div>
          <ArticleTypeList
            profileId={profileId}
            articleTypes={result.data ?? []}
          />
        </div>
      </div>
    </div>
  )
}
