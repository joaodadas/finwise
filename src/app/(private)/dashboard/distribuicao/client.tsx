'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { ProfileSelector } from '@/components/distribuicao/profile-selector'
import { DistributionDonuts } from '@/components/distribuicao/distribution-donuts'
import { DistributionDelta } from '@/components/distribuicao/distribution-delta'
import { DiagnosisPanel } from '@/components/distribuicao/diagnosis-panel'
import { DistribuicaoChat } from '@/components/distribuicao/distribuicao-chat'
import { DistribuicaoEmptyState } from '@/components/distribuicao/empty-state'
import { PROFILE_LABELS } from '@/lib/distribuicao/reference'
import type { InvestorProfile, UserContext } from '@/lib/distribuicao/types'

export function DistribuicaoClient({
  userId,
  initial,
}: {
  userId: string
  initial: UserContext
}) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [, startTransition] = useTransition()

  if (!initial.profile) return <ProfileSelector />

  if (editingProfile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>
          Voltar
        </Button>
        <ProfileSelector />
      </div>
    )
  }

  const label = PROFILE_LABELS[initial.profile]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Perfil ativo</p>
          <p className="mt-1 text-lg font-semibold">{label.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label.description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            startTransition(() => {
              setEditingProfile(true)
            })
          }
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Trocar perfil
        </Button>
      </div>

      {initial.totalInvested === 0 ? (
        <DistribuicaoEmptyState />
      ) : (
        <>
          <DistributionDonuts
            current={initial.current}
            target={initial.target}
            totalInvested={initial.totalInvested}
          />
          <DistributionDelta diff={initial.diff} />
          <DiagnosisPanel
            userId={userId}
            profile={initial.profile as InvestorProfile}
            current={initial.current}
          />
          <DistribuicaoChat profile={initial.profile as InvestorProfile} />
        </>
      )}
    </div>
  )
}
