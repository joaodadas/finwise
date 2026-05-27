import type { AllocationBucket } from './types'

type ColorPair = { light: string; dark: string }

export const BUCKET_COLORS: Record<AllocationBucket | 'Outros', ColorPair> = {
  'Renda Fixa': { light: '#3b82f6', dark: '#60a5fa' },
  'Ação': { light: '#8b5cf6', dark: '#a78bfa' },
  'FII': { light: '#f59e0b', dark: '#fbbf24' },
  'Cripto': { light: '#10b981', dark: '#34d399' },
  'Outros': { light: '#6b7280', dark: '#9ca3af' },
}
