import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userEmail={session.user.email || ''} />
      <main className="ml-64 min-h-screen p-8">{children}</main>
    </div>
  )
}
