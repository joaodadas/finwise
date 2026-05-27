# Distribuição de Investimentos com IA — Design Spec

## Overview

Feature que ajuda o usuário a entender se a distribuição atual da carteira está alinhada com um perfil de investidor (Iniciante ou Intermediário), gera um diagnóstico explicativo com IA, e permite tirar dúvidas via chat com contexto da carteira.

**PBI origem:** Item 5 — "Desenvolver auxílio de distribuição de investimentos na carteira por IA" (subtarefas: Investidor Iniciante e Intermediário / Tirar Dúvidas com IA)

**Escopo:** Acadêmico — sem recomendações de tickers específicos, sem chamadas a dados de mercado em tempo real.

---

## Goals

1. Permitir que o usuário escolha um perfil (Iniciante ou Intermediário) e persistir essa escolha
2. Comparar visualmente a distribuição atual da carteira (computada a partir de `asset`) com uma distribuição-referência por perfil
3. Gerar com IA um diagnóstico didático: o que está sub/super alocado, sugestões direcionais de rebalanceamento, justificativa educacional
4. Oferecer chat contextual onde o usuário pode tirar dúvidas sobre a análise, sua carteira, ou conceitos relacionados

## Non-goals

- Recomendar tickers específicos ("compre PETR4")
- Integrar com dados de mercado em tempo real (cotações, índices)
- Multi-moeda / análise de carteira internacional
- Backtesting, simulação de cenários, ou projeção de retorno
- Onboarding com questionário longo (KYC, tolerância a risco em N perguntas)
- Persistência do histórico de chat entre sessões
- Persistência do diagnóstico gerado (re-gerado a cada acesso)

---

## User Flow

1. Usuário entra em `/dashboard/distribuicao` (link via novo card no dashboard principal + CTA na seção "Distribuição" já existente)
2. **Se não tem perfil definido** → vê tela de seleção: dois cards lado a lado (Iniciante / Intermediário) com descrição curta. Ao clicar, perfil é salvo no banco e a tela transita pra análise
3. **Se já tem perfil** → vê a análise direto, com botão discreto "Trocar perfil" no topo
4. Análise contém:
   - **Header:** perfil ativo + breve descrição
   - **Donuts comparativos:** dois `EvilPieChart` lado a lado (Atual vs. Recomendada) com `innerRadius` configurado para donut
   - **Gráfico de delta:** `BarChart` shadcn horizontal por categoria — barra mostra `atual − alvo` (negativo em vermelho = sub-alocado, positivo em verde = super-alocado)
   - **Diagnóstico IA:** painel que streama a análise textual ao carregar (ou via botão "Gerar análise" se preferir manual — ver decisão abaixo)
   - **Chat:** abaixo, sempre presente, com mensagem inicial sugerindo perguntas
5. Usuário pode mandar mensagens no chat — cada mensagem leva contexto completo (perfil + carteira + distribuição recomendada)
6. Usuário pode editar carteira em `/dashboard/ativos` e voltar — análise é recomputada

**Decisão de UX para o diagnóstico:** auto-gerar ao carregar (UX mais fluida, custo aceitável pra acadêmico, e diagnóstico só é uma chamada). Se quiser virar manual depois é trivial.

---

## Architecture

### Routes

| Rota | Tipo | Função |
| ---- | ---- | ------ |
| `/dashboard/distribuicao` | page (server) | Carrega perfil + ativos do user, renderiza client |
| `/api/ai/distribuicao-analysis` | POST stream | Gera diagnóstico inicial (uma única chamada) |
| `/api/ai/distribuicao-chat` | POST stream | Chat com contexto |

### File structure (novos arquivos)

```
src/
├── app/
│   ├── (private)/dashboard/distribuicao/
│   │   ├── page.tsx              # server: carrega perfil + assets, passa pro client
│   │   └── client.tsx            # client: orquestra seletor, gráficos, diagnóstico, chat
│   ├── actions/
│   │   └── distribuicao.ts       # setInvestorProfile server action
│   └── api/ai/
│       ├── distribuicao-analysis/route.ts
│       └── distribuicao-chat/route.ts
├── components/
│   ├── distribuicao/
│   │   ├── profile-selector.tsx     # seleção inicial dos perfis
│   │   ├── distribution-donuts.tsx  # 2 EvilPieCharts lado a lado (atual + alvo)
│   │   ├── distribution-delta.tsx   # shadcn BarChart com delta por categoria
│   │   ├── diagnosis-panel.tsx      # painel do diagnóstico AI streamado
│   │   └── distribuicao-chat.tsx    # chat inline (não floating como o tutor)
│   ├── evilcharts/                  # adicionado via shadcn registry (não escrever à mão)
│   │   └── charts/pie-chart.tsx
│   └── ui/
│       └── chart.tsx                # shadcn chart primitives (ChartContainer, etc.)
└── lib/distribuicao/
    ├── reference.ts              # distribuições de referência por perfil
    ├── compute.ts                # cálculo da distribuição atual + diff
    └── types.ts                  # InvestorProfile, AllocationBucket, etc.
```

### Modificações em arquivos existentes

| Arquivo | Mudança |
| ------- | ------- |
| `src/db/schema.ts` | Adicionar coluna `investorProfile: text('investor_profile')` em `user` (nullable) |
| `src/app/(private)/dashboard/page.tsx` | Adicionar card "Distribuição com IA" no grid de métricas + CTA na seção "Distribuição" existente |

### Dependências e instalações novas

```bash
# Primitivas de chart do shadcn (ChartContainer, ChartTooltip etc.)
npx shadcn@latest add chart

# EvilCharts pie chart (vem como files do registry, não como dependency npm)
npx shadcn@latest add @evilcharts/pie-chart

# Motion (usada por EvilCharts para animações)
npm install motion
```

Recharts já está em `package.json` (`^3.8.1`) — não precisa reinstalar.

### Data model

Migration via `npm run db:generate` + `npm run db:migrate`:

```sql
ALTER TABLE "user" ADD COLUMN "investor_profile" text;
```

Type:

```ts
export type InvestorProfile = 'iniciante' | 'intermediario'
```

Validação na server action garante que só esses dois valores entram. Coluna nullable porque user antigo ainda não escolheu.

---

## Reference distributions

Em `src/lib/distribuicao/reference.ts`:

```ts
import type { InvestorProfile } from './types'

export type AllocationBucket = 'Ação' | 'FII' | 'Renda Fixa' | 'Cripto'

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

export const PROFILE_LABELS: Record<InvestorProfile, { title: string; description: string }> = {
  iniciante: {
    title: 'Iniciante',
    description: 'Foco em segurança e formação de reserva. Maior alocação em renda fixa, exposição moderada em renda variável.',
  },
  intermediario: {
    title: 'Intermediário',
    description: 'Maior tolerância a oscilações. Diversificação ampliada entre classes, com mais peso em renda variável.',
  },
}
```

**Importante:** valores meramente didáticos, alinhados com a natureza acadêmica do projeto. Devem aparecer no diagnóstico IA com a ressalva de que são referência educacional, não recomendação personalizada.

---

## Compute logic

`src/lib/distribuicao/compute.ts`:

- `computeCurrentDistribution(assets)` → retorna `{ [bucket]: percentage }` baseado em `quantity * averagePrice` por `type`
- `computeDiff(current, target)` → retorna `Array<{ bucket, current, target, delta }>` ordenado por |delta| desc
- Tipos não cadastrados (ex: `Outros`) viram bucket "Outros" no atual e ficam zerados no target (diff explica)
- Carteira vazia → distribuição atual toda zero, diff mostra apenas o alvo

---

## API contracts

### `POST /api/ai/distribuicao-analysis`

Request:
```ts
{
  profile: InvestorProfile
  currentDistribution: Record<string, number>  // % por bucket
  targetDistribution: Record<string, number>
  totalInvested: number
}
```

Response: text stream (one-shot diagnóstico, ~300-500 palavras)

System prompt cobre:
- Identidade: "FinDist", assistente educacional de distribuição
- Tom: didático, sem alarmismo, PT-BR
- Estrutura esperada: (1) visão geral, (2) categorias destacadas (sub/super alocadas), (3) sugestão direcional, (4) justificativa, (5) disclaimer "valores de referência educacional"
- Proibições: nada de tickers específicos, nada de "garantia de retorno", nada de previsões

Modelo: `geminiModel` (consistente com chart-assistant — custo + velocidade). `maxOutputTokens: 800`.

### `POST /api/ai/distribuicao-chat`

Request:
```ts
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>
  profile: InvestorProfile
  currentDistribution: Record<string, number>
  targetDistribution: Record<string, number>
  totalInvested: number
}
```

Response: text stream (multi-turn)

System prompt similar ao analysis mas focado em responder dúvidas, com o contexto da carteira sempre disponível.

Modelo: `geminiModel`. `maxOutputTokens: 1024`.

Ambas as rotas verificam sessão via `auth.api.getSession({ headers: await headers() })` antes de chamar a AI — 401 se não autenticado.

### Server action — `setInvestorProfile`

`src/app/actions/distribuicao.ts`:

```ts
'use server'

export async function setInvestorProfile(profile: InvestorProfile) {
  // 1. auth.api.getSession
  // 2. validar profile (zod ou check simples — apenas 'iniciante' | 'intermediario')
  // 3. db.update(user).set({ investorProfile: profile }).where(eq(user.id, session.user.id))
  // 4. revalidatePath('/dashboard/distribuicao')
}
```

---

## UI components

### `profile-selector.tsx`

- Dois `Card`s lado a lado, ícones (lucide: `Sprout` / `TrendingUp`)
- Hover destaca, click chama server action e re-renderiza (revalidate cuida)
- Loading state durante submit (disabled + spinner)

### `distribution-donuts.tsx`

- Dois `EvilPieChart` em grid (md:grid-cols-2), cada um com `Pie innerRadius={60}` para virar donut, `Tooltip` e `Legend isClickable`
- Mesma paleta de cores entre os dois (por bucket — Renda Fixa = azul, Ação = roxo, FII = âmbar, Cripto = verde), passada via `chartConfig` (formato `{ [bucket]: { label, colors: { light, dark } } }`)
- Centro do donut Atual mostra o total investido formatado em BRL; centro do donut Recomendada mostra apenas a label "Recomendada"
- Glow nos sectors mais expressivos (>30%) via prop `glowingSectors`
- Loading state nativo (`isLoading`) usado enquanto perfil não carregou

### `distribution-delta.tsx`

- shadcn `BarChart` horizontal (categorias no Y, delta no X), wrapper `ChartContainer`
- Cada barra colorida por sinal do delta: vermelho (`hsl(var(--destructive))`) se `atual − alvo < −2pp`, verde (`hsl(142 71% 45%)`) se `> +2pp`, cinza (`hsl(var(--muted-foreground))`) se entre −2pp e +2pp
- Label no fim da barra mostra `±X pp` (pp = percentual ponto)
- Eixo X com referência em 0 destacada
- Tooltip via shadcn `ChartTooltip` mostra: categoria, atual %, alvo %, delta

### `diagnosis-panel.tsx`

- `Card` com header "Análise da carteira"
- Conteúdo: texto streamado renderizado com `react-markdown` (já no projeto)
- Estado inicial: skeleton + "Analisando sua carteira..."
- Erro: mensagem amigável + botão "Tentar de novo"
- Re-trigger quando perfil muda ou ao montar pela primeira vez

### `distribuicao-chat.tsx`

- **Inline** (não floating como o tutor — espaço dedicado faz mais sentido aqui)
- `Card` com altura fixa (~500px), mensagens scrolláveis, input fixo embaixo
- Mensagem inicial do assistant sugerindo 3 perguntas como chips clicáveis ("Por que renda fixa?", "Como começo a rebalancear?", "FII é tudo igual?")
- Mesma estratégia de stream manual do `ai-tutor-chat.tsx` (já validada no projeto)
- Loading dots quando aguardando resposta

---

## Error handling

| Cenário | Tratamento |
| ------- | ---------- |
| Usuário não autenticado em `/dashboard/distribuicao` | `(private)/layout.tsx` já redireciona pra `/sign-in` |
| Carteira vazia | Análise/diagnóstico explicam o estado e direcionam pra `/dashboard/ativos` antes de qualquer rebalanceamento |
| AI falha (rede, rate limit, etc.) | Painel mostra erro amigável + botão "Tentar de novo"; chat mostra toast (sonner) e mantém input habilitado |
| Server action de perfil falha | Toast de erro, perfil não muda |
| Tipo de ativo desconhecido nos dados | Vira bucket "Outros" no atual, target = 0, diagnóstico menciona |

---

## Testing approach

Projeto não tem stack de testes automatizados. Plano:

1. **Manual smoke test** documentado no PR:
   - User sem perfil → vê seletor → seleciona Iniciante → vê análise
   - Trocar pra Intermediário → distribuição-alvo muda + diagnóstico re-gera
   - Carteira vazia → diagnóstico/chat lidam graciosamente
   - Adicionar ativo em `/dashboard/ativos`, voltar → atual recomputa
   - Chat aceita e responde dúvidas
   - Falha de AI (desligar `GOOGLE_GENERATIVE_AI_API_KEY` temporariamente) → erro amigável em ambos painel e chat
2. **Type check + lint** obrigatórios antes do merge: `npx tsc --noEmit && npm run lint`
3. **Não introduzir** stack de testes nesta entrega — fora do escopo da feature

---

## Out of scope (this delivery)

- Persistir histórico de chat
- Persistir diagnóstico gerado (cache)
- Mais perfis (conservador, agressivo, sofisticado)
- Recomendações específicas de tickers ou produtos
- Integração com dados de mercado em tempo real
- Goal-based planning, projeção de retorno, simulação Monte Carlo
- Rate limiting nas rotas AI
- Internacionalização (PT-BR only)

---

## Risks

- **IA gerar conselho irrealista ou perigoso** → mitigado por system prompt rígido, distribuição-referência hardcoded, disclaimer no UI, proibição explícita de tickers
- **Custo de AI escalar com chat** → modelo Gemini Flash Lite (já barato), `maxOutputTokens` limitado, sem persistência de histórico longo
- **Distribuição-referência ser opinativa** → documentado como "referência educacional"; valores podem ser revisados sem mudar arquitetura
