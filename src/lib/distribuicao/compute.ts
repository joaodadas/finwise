import { ALL_BUCKETS, OTHERS_BUCKET } from './types'
import type {
  AllocationBucket,
  DiffEntry,
  DistributionMap,
} from './types'

type AssetLike = {
  type: string
  quantity: string
  averagePrice: string
}

const KNOWN_BUCKETS = new Set<string>(ALL_BUCKETS)

export function computeCurrentDistribution(assets: AssetLike[]): {
  current: DistributionMap
  totalInvested: number
} {
  const byBucket: Record<string, number> = {}
  let totalInvested = 0

  for (const asset of assets) {
    const qty = parseFloat(asset.quantity)
    const px = parseFloat(asset.averagePrice)
    if (!Number.isFinite(qty) || !Number.isFinite(px)) continue
    const value = qty * px
    if (value <= 0) continue

    const bucket = KNOWN_BUCKETS.has(asset.type) ? asset.type : OTHERS_BUCKET
    byBucket[bucket] = (byBucket[bucket] ?? 0) + value
    totalInvested += value
  }

  const current: DistributionMap = {}
  if (totalInvested > 0) {
    for (const [bucket, value] of Object.entries(byBucket)) {
      current[bucket] = (value / totalInvested) * 100
    }
  }

  return { current, totalInvested }
}

export function computeDiff(
  current: DistributionMap,
  target: DistributionMap,
): DiffEntry[] {
  const buckets = new Set<string>([
    ...Object.keys(current),
    ...Object.keys(target),
  ])

  const entries: DiffEntry[] = []
  for (const bucket of buckets) {
    const c = current[bucket] ?? 0
    const t = target[bucket] ?? 0
    entries.push({ bucket, current: c, target: t, delta: c - t })
  }

  entries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return entries
}

export function toDistributionMap(
  source: Record<AllocationBucket, number>,
): DistributionMap {
  const out: DistributionMap = {}
  for (const [k, v] of Object.entries(source)) out[k] = v
  return out
}
