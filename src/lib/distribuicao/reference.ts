import type { InvestorProfile, AllocationBucket } from './types'

export const REFERENCE_DISTRIBUTION: Record<
  InvestorProfile,
  Record<AllocationBucket, number>
> = {
  iniciante: {
    'Renda Fixa': 60,
    'Ação': 20,
    'FII': 15,
    'Cripto': 5,
  },
  intermediario: {
    'Renda Fixa': 35,
    'Ação': 35,
    'FII': 20,
    'Cripto': 10,
  },
}

export const PROFILE_LABELS: Record<
  InvestorProfile,
  { title: string; description: string }
> = {
  iniciante: {
    title: 'Iniciante',
    description:
      'Foco em segurança e formação de reserva. Maior alocação em renda fixa, exposição moderada em renda variável.',
  },
  intermediario: {
    title: 'Intermediário',
    description:
      'Maior tolerância a oscilações. Diversificação ampliada entre classes, com mais peso em renda variável.',
  },
}
