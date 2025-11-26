import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { getPostProfile } from '@/lib/post-profile/actions'
import { getArticleType } from '@/lib/article-type/actions'
import { ArticleTypeForm } from '@/components/article-type/article-type-form'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string; typeId: string }>
}

export default async function EditArticleTypePage({ params }: Props) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id: profileId, typeId } = await params

  // プロファイルの存在確認
  const profileResult = await getPostProfile(profileId)
  if (!profileResult.success || !profileResult.data) {
    notFound()
  }

  // 記事タイプの取得
  const result = await getArticleType(typeId, profileId)
  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4">
          <Link
            href={`/dashboard/profiles/${profileId}/article-types`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 記事タイプ一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">記事タイプ編集</h1>
            <p className="mt-1 text-sm text-gray-500">
              プロファイル: {profileResult.data.name}
            </p>
          </div>
          <ArticleTypeForm profileId={profileId} articleType={result.data} />
        </div>
      </div>
    </div>
  )
}
