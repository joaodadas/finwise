import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { loadUserContext } from '@/lib/distribuicao/load'
import { DistribuicaoClient } from './client'

export const dynamic = 'force-dynamic'

export default async function DistribuicaoPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const ctx = await loadUserContext(session.user.id)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 w-full max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Distribuição com IA
        </h1>
        <p className="mt-2 text-muted-foreground">
          Compare a distribuição atual da sua carteira com a referência do seu perfil e tire dúvidas com o assistente.
        </p>
      </header>
      <DistribuicaoClient userId={session.user.id} initial={ctx} />
    </div>
  )
}
