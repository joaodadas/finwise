'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/sign-in')
        },
      },
    })
  }

  return (
    <button
      onClick={handleLogout}
      className="logout-btn"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Sair</span>
    </button>
  )
}
