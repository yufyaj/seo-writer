import type { Metadata } from 'next'
import '../src/app/globals.css'

export const metadata: Metadata = {
  title: 'SEO Writer',
  description: 'SEO Writer Application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
