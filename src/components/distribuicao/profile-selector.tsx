'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sprout, TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { setInvestorProfile } from '@/app/actions/distribuicao'
import { PROFILE_LABELS } from '@/lib/distribuicao/reference'
import type { InvestorProfile } from '@/lib/distribuicao/types'

const PROFILE_OPTIONS: Array<{ id: InvestorProfile; Icon: typeof Sprout }> = [
  { id: 'iniciante', Icon: Sprout },
  { id: 'intermediario', Icon: TrendingUp },
]

export function ProfileSelector() {
  const [pending, setPending] = useState<InvestorProfile | null>(null)
  const [, startTransition] = useTransition()

  function onPick(profile: InvestorProfile) {
    setPending(profile)
    startTransition(async () => {
      try {
        await setInvestorProfile(profile)
      } catch (err) {
        console.error(err)
        toast.error('Não foi possível salvar o perfil. Tente novamente.')
        setPending(null)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Qual seu perfil de investidor?</h2>
        <p className="mt-2 text-muted-foreground">
          Você pode trocar a qualquer momento. A escolha define a distribuição-referência usada na análise.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {PROFILE_OPTIONS.map(({ id, Icon }) => {
          const label = PROFILE_LABELS[id]
          const isPending = pending === id
          return (
            <Card
              key={id}
              className="cursor-pointer transition-all hover:border-primary/60 hover:shadow-md"
              onClick={() => !pending && onPick(id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{label.title}</CardTitle>
                </div>
                <CardDescription className="pt-2">{label.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled={!!pending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    `Sou ${label.title}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
