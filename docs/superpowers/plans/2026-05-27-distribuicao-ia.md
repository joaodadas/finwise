# Distribuição de Investimentos com IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/dashboard/distribuicao` que ajuda o usuário a comparar a distribuição atual da carteira com uma referência por perfil (Iniciante / Intermediário), gera um diagnóstico textual com IA e oferece chat contextual para dúvidas.

**Architecture:** Next.js 16 App Router. Server page carrega perfil + ativos do user via Drizzle e passa pra um client orquestrador. Lógica de distribuição em `lib/distribuicao/` (pura + um loader server-side). Duas rotas streaming Gemini (`/api/ai/distribuicao-analysis` e `/api/ai/distribuicao-chat`) carregam contexto server-side — client não envia dado de distribuição. Cache localStorage do diagnóstico por chave determinística. Visualização: EvilCharts pie chart × 2 (atual vs alvo) + shadcn BarChart (delta por categoria).

**Tech Stack:** Next.js 16, React 19, TypeScript 5 (strict), Drizzle ORM + Postgres, better-auth (com `additionalFields`), Vercel AI SDK v6 + `@ai-sdk/google` (Gemini Flash Lite), shadcn/ui, EvilCharts pie chart (via shadcn registry), Motion, Recharts (já instalado), Lucide icons.

**Reference spec:** [`docs/superpowers/specs/2026-05-27-distribuicao-ia-design.md`](../specs/2026-05-27-distribuicao-ia-design.md)

**Branch:** `feat/distribuicao-ia` (já criada)

**Commits:** Mensagens em PT-BR, formato `tipo(escopo): descrição` (conventional). **NÃO** incluir `Co-Authored-By: Claude` em nenhum commit — autor é apenas o usuário (preferência explícita).

---

## Task 1: Instalar dependências (shadcn chart, EvilCharts pie, motion)

**Files:**
- Create: `src/components/ui/chart.tsx` (gerado pelo shadcn CLI)
- Create: `src/components/evilcharts/charts/pie-chart.tsx` (gerado pelo EvilCharts registry)
- Create: `src/components/evilcharts/ui/chart.tsx` (gerado pelo EvilCharts registry, se aplicável)
- Modify: `package.json` (motion + possíveis dependências adicionadas pelos comandos)
- Modify: `package-lock.json`

- [ ] **Step 1: Instalar shadcn chart primitives**

Run:
```bash
npx shadcn@latest add chart
```
Expected: cria `src/components/ui/chart.tsx` com `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, etc. Confirme com `ls src/components/ui/chart.tsx`.

- [ ] **Step 2: Instalar EvilCharts pie chart via registry**

Run:
```bash
npx shadcn@latest add @evilcharts/pie-chart
```
Expected: cria arquivos em `src/components/evilcharts/`. Confirme com `ls src/components/evilcharts/charts/pie-chart.tsx`. Se o comando falhar (registry não reconhecido), execute o fallback no Step 2a abaixo.

- [ ] **Step 2a (fallback se Step 2 falhar): instalar manualmente**

Acesse https://evilcharts.com/docs/pie-chart/static e copie o source do componente para `src/components/evilcharts/charts/pie-chart.tsx`. Crie os helpers necessários (`src/components/evilcharts/ui/chart.tsx`) baseado no exemplo da doc.

- [ ] **Step 3: Instalar motion**

Run:
```bash
npm install motion
```
Expected: `motion` aparece em `package.json` `dependencies`.

- [ ] **Step 4: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros. Se algum import dos arquivos gerados quebrar, inspecione e ajuste.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/ui/chart.tsx src/components/evilcharts/
git commit -m "chore(deps): adiciona shadcn chart, EvilCharts pie chart e motion"
```

---

## Task 2: Schema da DB + better-auth additionalFields + migration

**Files:**
- Modify: `src/db/schema.ts` (adicionar coluna `investorProfile`)
- Modify: `src/lib/auth.ts` (adicionar `investorProfile` em `additionalFields`)
- Create: `drizzle/<timestamp>_add_investor_profile.sql` (gerado pelo `db:generate`)

- [ ] **Step 1: Editar `src/db/schema.ts`**

Localize o `pgTable('user', ...)` no arquivo (linhas 12–21 hoje). Adicione a coluna `investorProfile` após `image`:

```ts
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull().default('estudante'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  investorProfile: text('investor_profile'),  // ← nullable, default null
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

- [ ] **Step 2: Editar `src/lib/auth.ts`**

Adicionar `investorProfile` ao `user.additionalFields`:

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { nextCookies } from 'better-auth/next-js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: true },
      investorProfile: { type: 'string', required: false },
    },
  },
  plugins: [nextCookies()],
})
```

- [ ] **Step 3: Gerar migration**

Run:
```bash
npm run db:generate
```
Expected: cria arquivo em `drizzle/` com `ALTER TABLE "user" ADD COLUMN "investor_profile" text;`. Inspecione o SQL gerado.

- [ ] **Step 4: Subir o Docker (se ainda não estiver de pé)**

Run:
```bash
docker compose up -d
```
Expected: postgres na porta 5432 rodando.

- [ ] **Step 5: Aplicar migration**

Run:
```bash
npm run db:migrate
```
Expected: migration aplicada com sucesso, sem erros.

- [ ] **Step 6: Verificar via psql / db studio**

Run:
```bash
docker exec -i $(docker ps -qf "ancestor=postgres:16-alpine") psql -U finwise -d finwise -c '\d "user"'
```
Expected: lista as colunas do `user` table, incluindo `investor_profile | text |`.

- [ ] **Step 7: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros. O tipo de `session.user.investorProfile` deve estar disponível agora (validado em tarefas posteriores).

- [ ] **Step 8: Commit**

```bash
git add src/db/schema.ts src/lib/auth.ts drizzle/
git commit -m "feat(db): adiciona coluna investor_profile em user e expõe via better-auth additionalFields"
```

---

## Task 3: Lib — types, reference, colors

**Files:**
- Create: `src/lib/distribuicao/types.ts`
- Create: `src/lib/distribuicao/reference.ts`
- Create: `src/lib/distribuicao/colors.ts`

- [ ] **Step 1: Criar `src/lib/distribuicao/types.ts`**

```ts
export type InvestorProfile = 'iniciante' | 'intermediario'

export type AllocationBucket = 'Ação' | 'FII' | 'Renda Fixa' | 'Cripto'

export const ALL_BUCKETS: readonly AllocationBucket[] = [
  'Renda Fixa',
  'Ação',
  'FII',
  'Cripto',
] as const

export const OTHERS_BUCKET = 'Outros' as const

export type DistributionMap = Record<string, number> // chave = bucket (ou 'Outros'), valor = percentual 0–100

export type DiffEntry = {
  bucket: string
  current: number  // 0–100
  target: number   // 0–100
  delta: number    // current - target, em pontos percentuais
}

export type UserContext = {
  profile: InvestorProfile | null
  totalInvested: number
  current: DistributionMap
  target: DistributionMap
  diff: DiffEntry[]
}
```

- [ ] **Step 2: Criar `src/lib/distribuicao/reference.ts`**

```ts
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
```

- [ ] **Step 3: Criar `src/lib/distribuicao/colors.ts`**

```ts
import type { AllocationBucket } from './types'

type ColorPair = { light: string; dark: string }

export const BUCKET_COLORS: Record<AllocationBucket | 'Outros', ColorPair> = {
  'Renda Fixa': { light: '#3b82f6', dark: '#60a5fa' },
  'Ação': { light: '#8b5cf6', dark: '#a78bfa' },
  'FII': { light: '#f59e0b', dark: '#fbbf24' },
  'Cripto': { light: '#10b981', dark: '#34d399' },
  'Outros': { light: '#6b7280', dark: '#9ca3af' },
}
```

- [ ] **Step 4: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/distribuicao/types.ts src/lib/distribuicao/reference.ts src/lib/distribuicao/colors.ts
git commit -m "feat(distribuicao): adiciona tipos, distribuições de referência e paleta de cores"
```

---

## Task 4: Lib — compute (lógica pura sem IO)

**Files:**
- Create: `src/lib/distribuicao/compute.ts`

- [ ] **Step 1: Criar `src/lib/distribuicao/compute.ts`**

```ts
import { ALL_BUCKETS, OTHERS_BUCKET } from './types'
import type {
  AllocationBucket,
  DiffEntry,
  DistributionMap,
} from './types'

type AssetLike = {
  type: string
  quantity: string  // numeric vem como string do Drizzle
  averagePrice: string
}

const KNOWN_BUCKETS = new Set<string>(ALL_BUCKETS)

/**
 * Soma totalInvested e devolve a distribuição em % por bucket.
 * Tipos não conhecidos viram bucket "Outros".
 * Retorna { current: { bucket: percentage }, totalInvested }.
 */
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

/**
 * Devolve diff por bucket (atual − alvo). Inclui buckets que estão só no alvo (current = 0)
 * e buckets "Outros" presentes só no atual (target = 0).
 * Ordenado por |delta| desc para destaque visual.
 */
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

/**
 * Converte REFERENCE_DISTRIBUTION[profile] (Record<AllocationBucket, number>) para DistributionMap.
 */
export function toDistributionMap(
  source: Record<AllocationBucket, number>,
): DistributionMap {
  const out: DistributionMap = {}
  for (const [k, v] of Object.entries(source)) out[k] = v
  return out
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Smoke manual via Node REPL (opcional mas recomendado)**

Run:
```bash
npx tsx -e "
import { computeCurrentDistribution, computeDiff, toDistributionMap } from './src/lib/distribuicao/compute.ts'
import { REFERENCE_DISTRIBUTION } from './src/lib/distribuicao/reference.ts'

const assets = [
  { type: 'Ação', quantity: '10', averagePrice: '50' },     // 500
  { type: 'Renda Fixa', quantity: '1', averagePrice: '1000' },  // 1000
  { type: 'FII', quantity: '5', averagePrice: '100' },      // 500
]
const { current, totalInvested } = computeCurrentDistribution(assets)
console.log('total:', totalInvested)             // 2000
console.log('current:', current)                  // Renda Fixa: 50, Ação: 25, FII: 25
const target = toDistributionMap(REFERENCE_DISTRIBUTION.iniciante)
console.log('diff:', computeDiff(current, target))
"
```
Expected: totalInvested = 2000, current corretamente em %, diff ordenado por |delta|. Se `tsx` não estiver disponível, pule este step.

- [ ] **Step 4: Commit**

```bash
git add src/lib/distribuicao/compute.ts
git commit -m "feat(distribuicao): adiciona computeCurrentDistribution, computeDiff e toDistributionMap"
```

---

## Task 5: Lib — load (server-side data loader)

**Files:**
- Create: `src/lib/distribuicao/load.ts`

- [ ] **Step 1: Criar `src/lib/distribuicao/load.ts`**

```ts
import { db } from '@/db'
import { user, asset } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { REFERENCE_DISTRIBUTION } from './reference'
import { computeCurrentDistribution, computeDiff, toDistributionMap } from './compute'
import type { InvestorProfile, UserContext } from './types'

function isInvestorProfile(value: unknown): value is InvestorProfile {
  return value === 'iniciante' || value === 'intermediario'
}

/**
 * Carrega tudo que as rotas AI e a page precisam para renderizar/gerar
 * a análise de distribuição. NUNCA confia em dado vindo do client.
 *
 * Throws "NO_PROFILE" se o usuário ainda não selecionou perfil.
 */
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
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros. Em particular, `u.investorProfile` deve estar tipado como `string | null` graças ao schema do Task 2.

- [ ] **Step 3: Commit**

```bash
git add src/lib/distribuicao/load.ts
git commit -m "feat(distribuicao): adiciona loadUserContext server-side (perfil + assets + diff)"
```

---

## Task 6: Lib — prompts literais

**Files:**
- Create: `src/lib/distribuicao/prompts.ts`

- [ ] **Step 1: Criar `src/lib/distribuicao/prompts.ts`**

```ts
import { PROFILE_LABELS } from './reference'
import type { UserContext } from './types'

function fmtBrl(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)
}

function fmtDistribution(d: Record<string, number>): string {
  // ex: 'Renda Fixa: 50.0% | Ação: 25.0% | FII: 25.0%'
  return Object.entries(d)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v.toFixed(1)}%`)
    .join(' | ')
}

function profileLabelFor(ctx: UserContext): string {
  if (!ctx.profile) return 'desconhecido'
  return PROFILE_LABELS[ctx.profile].title
}

const ANALYSIS_TEMPLATE = `Você é o FinDist, um assistente educacional especializado em explicar a distribuição de uma carteira de investimentos de forma didática, em português brasileiro.

CONTEXTO DO USUÁRIO
Perfil do investidor: {{profileLabel}}
Total investido: {{totalBrl}}
Distribuição atual (% por categoria): {{currentJson}}
Distribuição de referência para o perfil (% por categoria): {{targetJson}}

DIRETRIZES
- Use linguagem simples, sem jargões. Se usar termo técnico, explique em uma frase.
- Tom encorajador e educativo. Nunca alarmista.
- NUNCA recomende compra ou venda de tickers específicos (ex: PETR4, BBAS3, MXRF11).
- NUNCA prometa retorno, garanta resultado ou faça previsões.
- Trate a distribuição de referência como "ponto de partida educacional", não como verdade absoluta.

ESTRUTURA DA ANÁLISE (~300–500 palavras, em markdown)
1. Uma frase de visão geral sobre a posição atual em relação ao perfil.
2. Duas a três categorias com maior diferença em relação ao alvo, explicadas em parágrafos curtos. Use os emojis 📈 (super-alocado) e 📉 (sub-alocado) inline.
3. Sugestões direcionais de rebalanceamento — em nível de categoria, nunca de ativo específico.
4. Justificativa educacional curta de por que esse perfil tem essa distribuição.
5. Disclaimer final: "Estas são referências educacionais. Decisões de investimento devem considerar seu contexto pessoal e, se possível, orientação profissional."`

const CHAT_TEMPLATE = `Você é o FinDist, assistente educacional sobre distribuição de carteira para investidores no Brasil.

CONTEXTO PERSISTENTE
Perfil do investidor: {{profileLabel}}
Total investido: {{totalBrl}}
Distribuição atual: {{currentJson}}
Distribuição de referência para o perfil: {{targetJson}}

DIRETRIZES
- Responda em português brasileiro, didático e direto.
- Se a pergunta foge de finanças/distribuição/educação financeira, recuse cordialmente e ofereça trazer de volta ao tema.
- NUNCA recomende tickers ou produtos específicos. Sem PETR4, sem "CDB do Banco X".
- NUNCA prometa retorno ou garanta resultado.
- Quando relevante, ancore a resposta na distribuição do usuário (use os números do contexto acima).
- Respostas: 2 a 6 parágrafos curtos. Listas tudo bem com moderação.`

function fill(template: string, ctx: UserContext): string {
  return template
    .replace('{{profileLabel}}', profileLabelFor(ctx))
    .replace('{{totalBrl}}', fmtBrl(ctx.totalInvested))
    .replace('{{currentJson}}', fmtDistribution(ctx.current))
    .replace('{{targetJson}}', fmtDistribution(ctx.target))
}

export function renderAnalysisPrompt(ctx: UserContext): string {
  return fill(ANALYSIS_TEMPLATE, ctx)
}

export function renderChatPrompt(ctx: UserContext): string {
  return fill(CHAT_TEMPLATE, ctx)
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/distribuicao/prompts.ts
git commit -m "feat(distribuicao): adiciona system prompts literais (analysis e chat)"
```

---

## Task 7: Server action — setInvestorProfile

**Files:**
- Create: `src/app/actions/distribuicao.ts`

- [ ] **Step 1: Criar `src/app/actions/distribuicao.ts`**

```ts
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
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/distribuicao.ts
git commit -m "feat(distribuicao): adiciona server action setInvestorProfile"
```

---

## Task 8: API route — `/api/ai/distribuicao-analysis`

**Files:**
- Create: `src/app/api/ai/distribuicao-analysis/route.ts`

- [ ] **Step 1: Criar `src/app/api/ai/distribuicao-analysis/route.ts`**

```ts
import { streamText } from 'ai'
import { geminiModel } from '@/ai/models'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { loadUserContext } from '@/lib/distribuicao/load'
import { renderAnalysisPrompt } from '@/lib/distribuicao/prompts'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const ctx = await loadUserContext(session.user.id)
    if (!ctx.profile) {
      return Response.json({ error: 'Perfil de investidor não definido.' }, { status: 400 })
    }
    if (ctx.totalInvested === 0) {
      return Response.json({ error: 'Carteira vazia — adicione ativos antes de gerar análise.' }, { status: 400 })
    }

    const system = renderAnalysisPrompt(ctx)
    const result = streamText({
      model: geminiModel,
      system,
      prompt: 'Gere a análise da carteira agora seguindo a estrutura definida.',
      maxOutputTokens: 800,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[distribuicao-analysis]', err)
    return Response.json(
      { error: 'Erro ao gerar análise. Tente novamente.' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/distribuicao-analysis/route.ts
git commit -m "feat(distribuicao): rota POST /api/ai/distribuicao-analysis (one-shot diagnóstico)"
```

---

## Task 9: API route — `/api/ai/distribuicao-chat`

**Files:**
- Create: `src/app/api/ai/distribuicao-chat/route.ts`

- [ ] **Step 1: Criar `src/app/api/ai/distribuicao-chat/route.ts`**

```ts
import { streamText } from 'ai'
import { geminiModel } from '@/ai/models'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { loadUserContext } from '@/lib/distribuicao/load'
import { renderChatPrompt } from '@/lib/distribuicao/prompts'

export const dynamic = 'force-dynamic'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = (await req.json()) as { messages: ChatMessage[] }
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (messages.length === 0) {
      return Response.json({ error: 'Nenhuma mensagem enviada.' }, { status: 400 })
    }

    const ctx = await loadUserContext(session.user.id)
    if (!ctx.profile) {
      return Response.json({ error: 'Perfil de investidor não definido.' }, { status: 400 })
    }
    if (ctx.totalInvested === 0) {
      return Response.json({ error: 'Carteira vazia — adicione ativos para iniciar o chat.' }, { status: 400 })
    }

    const system = renderChatPrompt(ctx)
    const result = streamText({
      model: geminiModel,
      system,
      messages,
      maxOutputTokens: 1024,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[distribuicao-chat]', err)
    return Response.json(
      { error: 'Erro ao processar mensagem. Tente novamente.' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/distribuicao-chat/route.ts
git commit -m "feat(distribuicao): rota POST /api/ai/distribuicao-chat (multi-turn streaming)"
```

---

## Task 10: Componente `profile-selector.tsx`

**Files:**
- Create: `src/components/distribuicao/profile-selector.tsx`

- [ ] **Step 1: Criar `src/components/distribuicao/profile-selector.tsx`**

```tsx
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
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/distribuicao/profile-selector.tsx
git commit -m "feat(distribuicao): adiciona ProfileSelector com Iniciante/Intermediário"
```

---

## Task 11: Componente `distribution-donuts.tsx`

**Files:**
- Create: `src/components/distribuicao/distribution-donuts.tsx`

> **Nota:** A API dos componentes EvilCharts (`EvilPieChart`, `Pie`, `Tooltip`, `Legend`) deve seguir o que foi instalado no Task 1. Se o nome dos imports diferir após o `npx shadcn add @evilcharts/pie-chart`, ajuste apenas os imports — a forma de uso é a do exemplo abaixo, conferida em https://evilcharts.com/docs/pie-chart/static.

- [ ] **Step 1: Criar `src/components/distribuicao/distribution-donuts.tsx`**

```tsx
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
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros. Se os tipos de `EvilPieChart` exigirem props extras (revealed pelo TS), ajuste consultando o arquivo gerado em `src/components/evilcharts/charts/pie-chart.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/distribuicao/distribution-donuts.tsx
git commit -m "feat(distribuicao): adiciona DistributionDonuts (EvilPieChart × 2 com aria-label)"
```

---

## Task 12: Componente `distribution-delta.tsx`

**Files:**
- Create: `src/components/distribuicao/distribution-delta.tsx`

- [ ] **Step 1: Criar `src/components/distribuicao/distribution-delta.tsx`**

```tsx
'use client'

import { Bar, BarChart, XAxis, YAxis, ReferenceLine, LabelList, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { DiffEntry } from '@/lib/distribuicao/types'

const NEUTRAL_THRESHOLD = 2 // pp

type Variant = 'over' | 'under' | 'neutral'

function variantOf(delta: number): Variant {
  if (delta >  NEUTRAL_THRESHOLD) return 'over'
  if (delta < -NEUTRAL_THRESHOLD) return 'under'
  return 'neutral'
}

const VARIANT_COLOR: Record<Variant, string> = {
  over: 'hsl(142 71% 45%)',                  // verde
  under: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
}

function fmtDelta(delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '' : ''  // negativo já vem com '-'
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
        <h3 className="text-sm font-semibold">Diferença por categoria (em pontos percentuais)</h3>
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
                formatter={(value, _name, item) => {
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
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros. Se algum prop tipado quebrar em algo (ex.: assinatura do `content` de `LabelList` divergir), inspecione o tipo do recharts no `node_modules` e ajuste apenas as anotações de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/components/distribuicao/distribution-delta.tsx
git commit -m "feat(distribuicao): adiciona DistributionDelta (BarChart shadcn com ícones e sinal)"
```

---

## Task 13: Componente `diagnosis-panel.tsx` (com cache localStorage)

**Files:**
- Create: `src/components/distribuicao/diagnosis-panel.tsx`

- [ ] **Step 1: Criar `src/components/distribuicao/diagnosis-panel.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import type { DistributionMap, InvestorProfile } from '@/lib/distribuicao/types'

const CACHE_VERSION = 1
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

type CacheEntry = { v: number; content: string; cachedAt: string }

function hashDistribution(d: DistributionMap): string {
  // djb2 sobre entradas ordenadas — determinístico e leve
  const stable = Object.keys(d)
    .sort()
    .map((k) => `${k}:${d[k].toFixed(2)}`)
    .join('|')
  let hash = 5381
  for (let i = 0; i < stable.length; i++) {
    hash = ((hash << 5) + hash + stable.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(16)
}

function cacheKey(userId: string, profile: InvestorProfile, current: DistributionMap): string {
  return `finwise:distribuicao-analysis:${userId}:${profile}:${hashDistribution(current)}`
}

function readCache(key: string): CacheEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (parsed.v !== CACHE_VERSION) return null
    const age = Date.now() - new Date(parsed.cachedAt).getTime()
    if (age > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(key: string, content: string): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry = { v: CACHE_VERSION, content, cachedAt: new Date().toISOString() }
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    /* quota cheia / disabled — ignore */
  }
}

export function DiagnosisPanel({
  userId,
  profile,
  current,
}: {
  userId: string
  profile: InvestorProfile
  current: DistributionMap
}) {
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const key = cacheKey(userId, profile, current)

  const fetchAnalysis = useCallback(async (forceRefresh = false) => {
    setError(null)
    if (!forceRefresh) {
      const cached = readCache(key)
      if (cached) {
        setContent(cached.content)
        setStreaming(false)
        return
      }
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setContent('')
    setStreaming(true)
    try {
      const res = await fetch('/api/ai/distribuicao-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error ?? 'Falha ao gerar análise.')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          acc += chunk
          setContent(acc)
        }
      }
      writeCache(key, acc)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error(err)
      setError((err as Error).message || 'Erro inesperado.')
    } finally {
      setStreaming(false)
    }
  }, [key])

  useEffect(() => {
    fetchAnalysis(false)
    return () => abortRef.current?.abort()
  }, [fetchAnalysis])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Análise da carteira
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          disabled={streaming}
          onClick={() => fetchAnalysis(true)}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${streaming ? 'animate-spin' : ''}`} />
          Re-analisar
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              <Button size="sm" variant="link" className="px-0" onClick={() => fetchAnalysis(true)}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        {!error && content.length === 0 && streaming && (
          <p className="text-sm text-muted-foreground">Analisando sua carteira...</p>
        )}
        {content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/distribuicao/diagnosis-panel.tsx
git commit -m "feat(distribuicao): adiciona DiagnosisPanel com streaming + cache localStorage TTL 24h"
```

---

## Task 14: Componente `distribuicao-chat.tsx`

**Files:**
- Create: `src/components/distribuicao/distribuicao-chat.tsx`

- [ ] **Step 1: Criar `src/components/distribuicao/distribuicao-chat.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { InvestorProfile } from '@/lib/distribuicao/types'

const MAX_TURNS_TO_SEND = 10
const SUGGESTIONS = [
  'Por que renda fixa pesa nesse perfil?',
  'Como começo a rebalancear minha carteira?',
  'FII conta como renda variável?',
]

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

export function DistribuicaoChat({ profile }: { profile: InvestorProfile }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Reset ao trocar de perfil — contexto anterior fica stale
  useEffect(() => {
    setMessages([])
    setInput('')
  }, [profile])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    const userMsg: Msg = { id: `${Date.now()}-u`, role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setIsStreaming(true)

    const toSend = next.slice(-MAX_TURNS_TO_SEND).map(({ role, content }) => ({ role, content }))

    try {
      const res = await fetch('/api/ai/distribuicao-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toSend }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Falha na resposta.')
      }
      const aiId = `${Date.now()}-a`
      setMessages((prev) => [...prev, { id: aiId, role: 'assistant', content: '' }])
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: m.content + chunk } : m)),
          )
        }
      }
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message || 'Erro ao enviar mensagem.')
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <Card className="flex h-[500px] flex-col overflow-hidden">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4 text-primary" />
          Tirar dúvidas com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Olá! Sou o FinDist. Posso explicar sua distribuição ou tirar dúvidas sobre o seu perfil.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
                m.role === 'user'
                  ? 'ml-auto rounded-tr-none bg-primary text-primary-foreground'
                  : 'mr-auto rounded-tl-none bg-muted text-foreground',
              )}
            >
              {m.content}
            </div>
          ))}
          {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="mr-auto flex max-w-[85%] items-center gap-1 rounded-lg rounded-tl-none bg-muted px-3 py-2 text-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: '0.15s' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: '0.3s' }} />
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex gap-2 border-t bg-muted/30 p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tire sua dúvida..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/distribuicao/distribuicao-chat.tsx
git commit -m "feat(distribuicao): adiciona DistribuicaoChat (inline, reset por perfil, bound 10 turns)"
```

---

## Task 15: Componente `empty-state.tsx`

**Files:**
- Create: `src/components/distribuicao/empty-state.tsx`

- [ ] **Step 1: Criar `src/components/distribuicao/empty-state.tsx`**

```tsx
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowRight } from 'lucide-react'

export function DistribuicaoEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Sua carteira está vazia</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Adicione pelo menos um ativo para que a IA consiga analisar sua distribuição e sugerir
            ajustes em relação ao seu perfil.
          </p>
        </div>
        <Link href="/dashboard/ativos">
          <Button className="group">
            Adicionar ativos
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/distribuicao/empty-state.tsx
git commit -m "feat(distribuicao): adiciona DistribuicaoEmptyState para carteira vazia"
```

---

## Task 16: Página + client orquestrador

**Files:**
- Create: `src/app/(private)/dashboard/distribuicao/page.tsx`
- Create: `src/app/(private)/dashboard/distribuicao/client.tsx`

- [ ] **Step 1: Criar `src/app/(private)/dashboard/distribuicao/page.tsx`**

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { loadUserContext } from '@/lib/distribuicao/load'
import { DistribuicaoClient } from './client'

export const dynamic = 'force-dynamic'

export default async function DistribuicaoPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const ctx = await loadUserContext(session.user.id)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 w-full max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Distribuição com IA
        </h1>
        <p className="mt-2 text-muted-foreground">
          Compare a distribuição atual da sua carteira com a referência do seu perfil e tire dúvidas com o assistente.
        </p>
      </header>
      <DistribuicaoClient userId={session.user.id} initial={ctx} />
    </div>
  )
}
```

- [ ] **Step 2: Criar `src/app/(private)/dashboard/distribuicao/client.tsx`**

```tsx
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
```

- [ ] **Step 3: Type check**

Run:
```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 4: Smoke render**

Run:
```bash
npm run dev
```
Em outro terminal, abra `http://localhost:3000/dashboard/distribuicao` (autenticado). Verifique:
- (a) usuário sem perfil → vê o seletor
- (b) ao selecionar, página recarrega e mostra ou empty-state (se carteira vazia) ou donuts+delta+diagnóstico+chat
Encerre o dev server quando terminar (`Ctrl+C`).

- [ ] **Step 5: Commit**

```bash
git add src/app/\(private\)/dashboard/distribuicao/
git commit -m "feat(distribuicao): adiciona página /dashboard/distribuicao e client orquestrador"
```

---

## Task 17: Linkar a feature no dashboard principal

**Files:**
- Modify: `src/app/(private)/dashboard/page.tsx`

- [ ] **Step 1: Editar `src/app/(private)/dashboard/page.tsx`**

Faça duas mudanças cirúrgicas:

**(a) Adicionar o ícone `PieChart` (se ainda não está importado de outro lugar) e o `Compass` da lucide-react.** Localize o import existente:
```ts
import { Wallet, PieChart, TrendingUp, ArrowRight, Activity, DollarSign, Briefcase, BarChart2, Sparkles, BookOpen } from 'lucide-react'
```
Adicione `Compass`:
```ts
import { Wallet, PieChart, TrendingUp, ArrowRight, Activity, DollarSign, Briefcase, BarChart2, Sparkles, BookOpen, Compass } from 'lucide-react'
```

**(b) Adicionar um novo `Card` "Distribuição com IA" no grid de métricas**, logo após o card "Aprender" (linha ~149) — antes do `</div>` que fecha o grid (linha ~150):

```tsx
        {/* Distribuição com IA Card */}
        <Card className="hover:border-cyan-500/50 transition-colors duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição com IA</CardTitle>
            <div className="p-2 bg-cyan-500/10 rounded-full">
              <Compass className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-6 w-6 text-cyan-500" />
              <span className="text-lg font-bold">Análise</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Compare sua carteira com a referência por perfil
            </p>
            <Link href="/dashboard/distribuicao">
              <Button size="sm" variant="outline" className="group/btn border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-600 text-xs w-full">
                Abrir análise
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
```

**(c) Adicionar link discreto no header do card "Distribuição" existente** (que já está em ~linha 214). Substitua a linha:
```tsx
<CardTitle className="text-xl">Distribuição</CardTitle>
<CardDescription>Seus ativos por categoria de investimento</CardDescription>
```
por:
```tsx
<div className="flex flex-row items-center justify-between gap-2">
  <CardTitle className="text-xl">Distribuição</CardTitle>
  <Link href="/dashboard/distribuicao" className="text-xs font-medium text-primary hover:underline">
    Ver análise com IA →
  </Link>
</div>
<CardDescription>Seus ativos por categoria de investimento</CardDescription>
```

- [ ] **Step 2: Type check + lint**

Run:
```bash
npx tsc --noEmit && npm run lint
```
Expected: zero erros, zero warnings novos.

- [ ] **Step 3: Smoke render**

Run:
```bash
npm run dev
```
Acesse `http://localhost:3000/dashboard`. Verifique:
- (a) novo card "Distribuição com IA" no grid de métricas, clicável
- (b) link "Ver análise com IA →" no header do card Distribuição existente
- (c) ambos navegam pra `/dashboard/distribuicao`

- [ ] **Step 4: Commit**

```bash
git add src/app/\(private\)/dashboard/page.tsx
git commit -m "feat(dashboard): adiciona card e link para Distribuição com IA"
```

---

## Task 18: Smoke test end-to-end + cleanup final

**Files:**
- (apenas verificação; sem mudança de arquivo)

- [ ] **Step 1: Type check + lint final**

Run:
```bash
npx tsc --noEmit && npm run lint
```
Expected: zero erros, zero warnings.

- [ ] **Step 2: Subir Docker + dev**

```bash
docker compose up -d
npm run dev
```

- [ ] **Step 3: Smoke checklist (ative `http://localhost:3000`, autenticado)**

Marque cada item:

  - [ ] **(a)** Apagar `user.investorProfile` no DB (`docker exec -i $(docker ps -qf "ancestor=postgres:16-alpine") psql -U finwise -d finwise -c "UPDATE \"user\" SET investor_profile = NULL"`), recarregar `/dashboard/distribuicao`. Vê seletor de perfil.
  - [ ] **(b)** Clicar em "Sou Iniciante". Página recarrega. Mostra "Perfil ativo: Iniciante" no topo.
  - [ ] **(c)** Se carteira vazia → vê empty state. Adicionar 2–3 ativos em `/dashboard/ativos` (ex: 10 PETR4 a R$50, 1 Tesouro a R$1000, 5 FII a R$100). Voltar pra `/dashboard/distribuicao`.
  - [ ] **(d)** Donuts renderizam com cores corretas por categoria, donut "Atual" mostra total formatado em BRL no centro.
  - [ ] **(e)** Delta chart aparece com ícones (`ArrowUp`/`ArrowDown`/`Minus`) + delta com sinal (`+X.Xpp`/`-X.Xpp`).
  - [ ] **(f)** Diagnóstico IA streama parágrafos didáticos com emojis, sem mencionar tickers específicos, com disclaimer no final.
  - [ ] **(g)** Refresh da página: diagnóstico aparece **instantaneamente** (cache localStorage hit).
  - [ ] **(h)** Clicar "Re-analisar" gera novo diagnóstico (streaming visível).
  - [ ] **(i)** Adicionar um ativo novo, voltar à página: novo diagnóstico gera (cache invalida porque hash mudou).
  - [ ] **(j)** Chat: clicar em chip "Por que renda fixa pesa nesse perfil?" → resposta chega via stream.
  - [ ] **(k)** Mandar 3+ mensagens. Verificar no Network Tab que `messages` enviadas estão limitadas (≤ 10 turns).
  - [ ] **(l)** Trocar perfil para "Intermediário": chat **reseta** (volta pros chips), donut alvo muda, diagnóstico re-gera.
  - [ ] **(m)** Testar falha de AI: editar `.env`, comentar `GOOGLE_GENERATIVE_AI_API_KEY`, restartar `npm run dev`. Recarregar página: diagnóstico mostra erro amigável com botão "Tentar novamente". Chat mostra toast em mensagem nova. Restaurar a key.
  - [ ] **(n)** Card "Distribuição com IA" no dashboard principal funciona e navega corretamente.
  - [ ] **(o)** Link "Ver análise com IA →" no card "Distribuição" do dashboard funciona.

- [ ] **Step 4: Limpar testes / sair**

Encerre `npm run dev` (`Ctrl+C`). Encerre `docker compose down` se preferir.

- [ ] **Step 5: Push da branch + abrir PR**

```bash
git push -u origin feat/distribuicao-ia
gh pr create --title "feat(distribuicao): página de distribuição da carteira com IA" --body "$(cat <<'EOF'
## Summary

Implementa o PBI #5 — auxílio de distribuição de investimentos por IA.

- Nova página `/dashboard/distribuicao` com seleção de perfil (Iniciante/Intermediário), comparação visual atual vs. recomendada, diagnóstico IA streamado e chat contextual
- Coluna `investor_profile` em `user` exposta via better-auth `additionalFields`
- 2 rotas streaming Gemini Flash Lite (analysis + chat) com contexto carregado server-side (nunca confia em dado do client)
- Cache localStorage do diagnóstico com TTL 24h e chave determinística sobre estado da carteira
- Visualização com EvilCharts pie chart (×2) + shadcn BarChart com a11y (ícone + sinal além de cor)
- Distribuições-referência hardcoded em `lib/distribuicao/reference.ts` (claramente marcadas como educacionais)

## Test plan

Smoke manual cobrindo todos os fluxos:
- [ ] Sem perfil → seletor
- [ ] Carteira vazia → empty state (sem chamada à IA)
- [ ] Carteira preenchida → donuts + delta + diagnóstico + chat
- [ ] Cache localStorage funciona em refresh
- [ ] Re-analisar invalida cache
- [ ] Mudança de carteira invalida cache implicitamente
- [ ] Chat reseta ao trocar perfil
- [ ] Bound de 10 turns no payload do chat
- [ ] Erro de AI → mensagem amigável + retry
- [ ] Cards/links no dashboard principal funcionam
EOF
)"
```

- [ ] **Step 6: Commit final (se houver mudança não-comitada)**

Se ainda houver algo não comitado:
```bash
git status
git add -A  # use com cuidado; revise o que vai
git commit -m "chore(distribuicao): ajustes finais pós-smoke"
git push
```

---

## Self-review (preencher após implementar)

- [ ] Todos os 18 tasks marcados como completos
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npm run lint` passa sem warnings novos
- [ ] Smoke checklist (Task 18 Step 3) 100% verde
- [ ] PR aberto com summary + test plan
- [ ] Nenhum commit traz `Co-Authored-By: Claude`
