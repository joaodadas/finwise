'use client'

import { Bar, BarChart, XAxis, YAxis, ReferenceLine, LabelList, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { DiffEntry } from '@/lib/distribuicao/types'

const NEUTRAL_THRESHOLD = 2

type Variant = 'over' | 'under' | 'neutral'

function variantOf(delta: number): Variant {
  if (delta > NEUTRAL_THRESHOLD) return 'over'
  if (delta < -NEUTRAL_THRESHOLD) return 'under'
  return 'neutral'
}

const VARIANT_COLOR: Record<Variant, string> = {
  over: 'hsl(142 71% 45%)',
  under: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
}

function fmtDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}pp`
}

const CHART_CONFIG: ChartConfig = {
  delta: { label: 'Delta', color: 'hsl(var(--primary))' },
}

export function DistributionDelta({ diff }: { diff: DiffEntry[] }) {
  const data = diff.map((d) => ({
    bucket: d.bucket,
    delta: d.delta,
    variant: variantOf(d.delta),
    current: d.current,
    target: d.target,
  }))

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Diferença por categoria (pontos percentuais)</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ArrowDown className="h-3 w-3" /> sub-alocado
          </span>
          <span className="inline-flex items-center gap-1">
            <Minus className="h-3 w-3" /> neutro
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="h-3 w-3" /> super-alocado
          </span>
        </div>
      </div>
      <ChartContainer config={CHART_CONFIG} className="h-[220px] w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 56 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="bucket" type="category" tickLine={false} axisLine={false} width={88} />
          <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel={false}
                formatter={(_value, _name, item) => {
                  const p = item.payload as { current: number; target: number; delta: number }
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span>Atual: {p.current.toFixed(1)}%</span>
                      <span>Alvo: {p.target.toFixed(1)}%</span>
                      <span>Δ: {fmtDelta(p.delta)}</span>
                    </div>
                  )
                }}
              />
            }
          />
          <Bar dataKey="delta" radius={4}>
            {data.map((d, i) => (
              <Cell key={i} fill={VARIANT_COLOR[d.variant]} />
            ))}
            <LabelList
              dataKey="delta"
              position="right"
              content={(props) => {
                const x = Number(props.x ?? 0)
                const y = Number(props.y ?? 0)
                const w = Number(props.width ?? 0)
                const h = Number(props.height ?? 0)
                const delta = Number(props.value ?? 0)
                const variant = variantOf(delta)
                const Icon = variant === 'over' ? ArrowUp : variant === 'under' ? ArrowDown : Minus
                const xPos = (delta >= 0 ? x + w : x) + 6 * (delta >= 0 ? 1 : -1)
                return (
                  <g transform={`translate(${xPos}, ${y + h / 2})`}>
                    <Icon x={-6} y={-6} width={12} height={12} className="fill-current text-foreground" />
                    <text
                      x={delta >= 0 ? 10 : -10}
                      dy={4}
                      textAnchor={delta >= 0 ? 'start' : 'end'}
                      className="fill-current text-[11px] font-medium text-foreground"
                    >
                      {fmtDelta(delta)}
                    </text>
                  </g>
                )
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
