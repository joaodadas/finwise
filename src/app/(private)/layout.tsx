import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NewsCarousel } from '@/components/news-carousel'
import { BackToHome } from '@/components/back-to-home'
import { LogoutButton } from '@/components/logout-button'

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NewsCarousel />
      <div className="flex justify-between items-center px-6 pt-3">
        <BackToHome />
        <div className="ml-auto">
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
