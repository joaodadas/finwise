'use client'

import {
  EvilPieChart,
  Pie,
  Tooltip,
  Legend,
} from '@/components/evilcharts/charts/pie-chart'
import { type ChartConfig } from '@/components/evilcharts/ui/chart'
import { BUCKET_COLORS } from '@/lib/distribuicao/colors'
import type { DistributionMap } from '@/lib/distribuicao/types'

type DonutDatum = { bucket: string; value: number }

function toData(d: DistributionMap): DonutDatum[] {
  return Object.entries(d)
    .filter(([, v]) => v > 0)
    .map(([bucket, value]) => ({ bucket, value }))
}

function buildChartConfig(data: DonutDatum[]): ChartConfig {
  const config: ChartConfig = {}
  for (const { bucket } of data) {
    const colors = BUCKET_COLORS[bucket as keyof typeof BUCKET_COLORS] ?? BUCKET_COLORS['Outros']
    config[bucket] = {
      label: bucket,
      colors: { light: [colors.light], dark: [colors.dark] },
    }
  }
  return config
}

function ariaSummary(label: string, data: DonutDatum[]): string {
  if (data.length === 0) return `${label}: sem dados.`
  const parts = data
    .sort((a, b) => b.value - a.value)
    .map((d) => `${d.value.toFixed(1)}% em ${d.bucket}`)
    .join(', ')
  return `${label}: ${parts}.`
}

function fmtBrl(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export function DistributionDonuts({
  current,
  target,
  totalInvested,
}: {
  current: DistributionMap
  target: DistributionMap
  totalInvested: number
}) {
  const currentData = toData(current)
  const targetData = toData(target)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DonutCard
        title="Distribuição atual"
        centerLabel={fmtBrl(totalInvested)}
        data={currentData}
      />
      <DonutCard title="Distribuição recomendada" centerLabel="Recomendada" data={targetData} />
    </div>
  )
}

function DonutCard({
  title,
  centerLabel,
  data,
}: {
  title: string
  centerLabel: string
  data: DonutDatum[]
}) {
  const config = buildChartConfig(data)
  return (
    <div
      className="flex flex-col rounded-lg border bg-card p-4"
      role="figure"
      aria-label={ariaSummary(title, data)}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
      </div>
      <div className="relative h-64">
        <EvilPieChart
          className="h-full w-full"
          data={data}
          dataKey="value"
          nameKey="bucket"
          config={config}
        >
          <Legend isClickable />
          <Tooltip />
          <Pie innerRadius={60} isClickable />
        </EvilPieChart>
      </div>
    </div>
  )
}
