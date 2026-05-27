export type InvestorProfile = 'iniciante' | 'intermediario'

export type AllocationBucket = 'Ação' | 'FII' | 'Renda Fixa' | 'Cripto'

export const ALL_BUCKETS: readonly AllocationBucket[] = [
  'Renda Fixa',
  'Ação',
  'FII',
  'Cripto',
] as const

export const OTHERS_BUCKET = 'Outros' as const

export type DistributionMap = Record<string, number>

export type DiffEntry = {
  bucket: string
  current: number
  target: number
  delta: number
}

export type UserContext = {
  profile: InvestorProfile | null
  totalInvested: number
  current: DistributionMap
  target: DistributionMap
  diff: DiffEntry[]
}
