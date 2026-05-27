import { db } from '@/db'
import { user, asset } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { REFERENCE_DISTRIBUTION } from './reference'
import { computeCurrentDistribution, computeDiff, toDistributionMap } from './compute'
import type { InvestorProfile, UserContext } from './types'

function isInvestorProfile(value: unknown): value is InvestorProfile {
  return value === 'iniciante' || value === 'intermediario'
}

export async function loadUserContext(userId: string): Promise<UserContext> {
  const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (!u) throw new Error('USER_NOT_FOUND')

  const profile = isInvestorProfile(u.investorProfile) ? u.investorProfile : null
  const assets = await db.select().from(asset).where(eq(asset.userId, userId))

  const { current, totalInvested } = computeCurrentDistribution(assets)
  const target = profile ? toDistributionMap(REFERENCE_DISTRIBUTION[profile]) : {}
  const diff = profile ? computeDiff(current, target) : []

  return { profile, totalInvested, current, target, diff }
}
