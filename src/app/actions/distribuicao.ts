'use server'

import { db } from '@/db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { InvestorProfile } from '@/lib/distribuicao/types'

const VALID_PROFILES: InvestorProfile[] = ['iniciante', 'intermediario']

function isInvestorProfile(value: string): value is InvestorProfile {
  return (VALID_PROFILES as string[]).includes(value)
}

export async function setInvestorProfile(profile: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  if (!isInvestorProfile(profile)) {
    throw new Error(`Perfil inválido: ${profile}`)
  }

  await db
    .update(user)
    .set({ investorProfile: profile, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  revalidatePath('/dashboard/distribuicao')
  revalidatePath('/dashboard')
}
