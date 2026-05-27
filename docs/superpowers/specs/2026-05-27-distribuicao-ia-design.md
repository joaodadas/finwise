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
- Persistência server-side do diagnóstico (só cache client-side localStorage com TTL — ver seção Caching)

---

## User Flow

1. Usuário entra em `/dashboard/distribuicao` (link via novo card no dashboard principal + link "Ver análise com IA →" no header da seção "Distribuição" já existente)
2. **Se não tem perfil definido** → vê tela de seleção: dois cards lado a lado (Iniciante / Intermediário) com descrição curta. Ao clicar, perfil é salvo no banco e a tela transita pra análise
3. **Se tem perfil mas `totalInvested === 0`** (carteira vazia) → empty state com CTA "Adicione ativos primeiro" → `/dashboard/ativos`. **Nenhuma chamada à IA é feita nesse estado.**
4. **Se tem perfil e carteira não-vazia** → vê a análise direto, com botão discreto "Trocar perfil" no topo
5. Análise contém:
   - **Header:** perfil ativo + breve descrição
   - **Donuts comparativos:** dois `EvilPieChart` lado a lado (Atual vs. Recomendada) com `innerRadius` configurado para donut
   - **Gráfico de delta:** `BarChart` shadcn horizontal por categoria — barra mostra `atual − alvo` (sub-alocado em vermelho, super-alocado em verde, neutro em cinza), com ícone `ArrowDown`/`ArrowUp` e sinal `±` no label da barra para garantir leitura sem depender de cor (WCAG)
   - **Diagnóstico IA:** painel que streama a análise textual ao carregar (cache client-side cobre refreshes — ver Caching abaixo)
   - **Chat:** abaixo, sempre presente, com mensagem inicial sugerindo perguntas
6. Usuário pode mandar mensagens no chat — cada mensagem é enviada apenas com `{ messages }` ao servidor; o contexto (perfil + carteira + alvo) é carregado server-side
7. Usuário pode editar carteira em `/dashboard/ativos` e voltar — análise é recomputada (cache do diagnóstico invalida porque a chave de cache muda)
8. **Trocar de perfil reseta o chat** — mensagens anteriores ficam com contexto stale, então a UI limpa o histórico e mostra de novo as perguntas-sugestão. Diagnóstico re-gera.

**Decisão de UX para o diagnóstico:** auto-gerar ao montar (UX mais fluida; cache mata custo em refreshes).

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
│   │   ├── page.tsx              # server: carrega perfil + assets, passa pro client; export const dynamic = 'force-dynamic'
│   │   └── client.tsx            # client: orquestra seletor, gráficos, diagnóstico, chat; cache localStorage do diagnóstico
│   ├── actions/
│   │   └── distribuicao.ts       # setInvestorProfile server action
│   └── api/ai/
│       ├── distribuicao-analysis/route.ts  # server-side load: assets + reference; recebe apenas { } no body (autenticado)
│       └── distribuicao-chat/route.ts      # server-side load: assets + reference; recebe { messages }
├── components/
│   ├── distribuicao/
│   │   ├── profile-selector.tsx     # seleção inicial dos perfis
│   │   ├── distribution-donuts.tsx  # 2 EvilPieCharts lado a lado (atual + alvo)
│   │   ├── distribution-delta.tsx   # shadcn BarChart com delta por categoria, com ícones e sinal
│   │   ├── diagnosis-panel.tsx      # painel do diagnóstico AI streamado
│   │   ├── distribuicao-chat.tsx    # chat inline; reseta histórico ao trocar perfil
│   │   └── empty-state.tsx          # CTA quando totalInvested === 0
│   ├── evilcharts/                  # adicionado via shadcn registry (não escrever à mão)
│   │   └── charts/pie-chart.tsx
│   └── ui/
│       └── chart.tsx                # shadcn chart primitives (ChartContainer, etc.)
└── lib/distribuicao/
    ├── reference.ts              # distribuições de referência por perfil
    ├── compute.ts                # cálculo da distribuição atual + diff (puro, sem IO)
    ├── colors.ts                 # BUCKET_COLORS — paleta única consumida por donuts e delta chart
    ├── prompts.ts                # system prompts literais (analysis e chat)
    ├── load.ts                   # helpers server-side: loadUserContext(userId) → { profile, assets, totalInvested, current, target }
    └── types.ts                  # InvestorProfile, AllocationBucket, etc.
```

### Modificações em arquivos existentes

| Arquivo | Mudança |
| ------- | ------- |
| `src/db/schema.ts` | Adicionar coluna `investorProfile: text('investor_profile')` em `user` (nullable) |
| `src/lib/auth.ts` | Adicionar `investorProfile: { type: 'string', required: false }` em `user.additionalFields` (junto com o `role` que já existe) |
| `src/app/(private)/dashboard/page.tsx` | (a) Adicionar novo `Card` "Distribuição com IA" no grid de métricas, linkando para `/dashboard/distribuicao`. (b) No card "Distribuição" existente, adicionar no `CardHeader` (ou logo abaixo do `CardDescription`) um link discreto "Ver análise com IA →" apontando para `/dashboard/distribuicao`. Não mexer na barra de progresso já existente — fica como visão rápida; a página dedicada é onde mora a análise completa. |

> **Por que `additionalFields`:** o client (`auth-client.ts`) já usa `inferAdditionalFields<typeof auth>()`, então adicionar o campo no server propaga o tipo automaticamente. Sem essa configuração, `auth.api.getSession()` não inclui `investorProfile` no objeto user retornado — daria gambiarra com query extra.

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

**Princípio:** as rotas AI nunca confiam em distribuição vinda do client. Toda contagem é derivada server-side a partir do `userId` autenticado, dos `asset` do banco e da `REFERENCE_DISTRIBUTION` (constante de servidor) para o perfil salvo em `user.investorProfile`. O client não precisa enviar isso — reduz superfície de erro/spoof e mantém uma fonte de verdade.

Helper compartilhado em `src/lib/distribuicao/load.ts`:

```ts
export async function loadUserContext(userId: string) {
  // 1. SELECT investor_profile FROM user WHERE id = userId
  // 2. SELECT * FROM asset WHERE user_id = userId
  // 3. compute current distribution + totalInvested
  // 4. resolve target = REFERENCE_DISTRIBUTION[profile]
  // 5. return { profile, totalInvested, current, target, diff }
  // Se profile === null → throw 'NO_PROFILE'
  // Se totalInvested === 0 → retorna mas client cobre o empty state antes de chamar
}
```

### `POST /api/ai/distribuicao-analysis`

Request body: `{}` (vazio; a sessão identifica o user; tudo carregado server-side)

Response: text stream (one-shot diagnóstico, ~300–500 palavras em markdown)

Pseudo-fluxo:
```ts
const session = await auth.api.getSession({ headers: await headers() })
if (!session?.user) return new Response('Unauthorized', { status: 401 })
const ctx = await loadUserContext(session.user.id)
if (!ctx.profile) return new Response('Profile not set', { status: 400 })
if (ctx.totalInvested === 0) return new Response('Empty portfolio', { status: 400 })
const prompt = renderAnalysisPrompt(ctx)  // ver lib/distribuicao/prompts.ts
return streamText({ model: geminiModel, system: prompt, prompt: 'Gere a análise.', maxOutputTokens: 800 }).toTextStreamResponse()
```

### `POST /api/ai/distribuicao-chat`

Request body:
```ts
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>  // últimas 10 turns no máximo (cliente trunca)
}
```

Response: text stream (multi-turn)

Pseudo-fluxo idêntico ao de análise, exceto que usa o `renderChatPrompt(ctx)` como system e passa `messages`.

Modelo: `geminiModel` em ambas. `maxOutputTokens`: 800 (analysis) / 1024 (chat).

Validação:
- 401 se não autenticado
- 400 se perfil não definido ou carteira vazia (client cobre, mas defesa em profundidade)
- 500 com mensagem genérica em erro de IA

### Server action — `setInvestorProfile`

`src/app/actions/distribuicao.ts`:

```ts
'use server'

export async function setInvestorProfile(profile: InvestorProfile) {
  // 1. auth.api.getSession
  // 2. validar profile (check 'iniciante' | 'intermediario'); throw em inválido
  // 3. db.update(user).set({ investorProfile: profile }).where(eq(user.id, session.user.id))
  // 4. revalidatePath('/dashboard/distribuicao')
  // 5. revalidatePath('/dashboard')  // pra atualizar o card no dashboard principal se exibir o perfil
}
```

---

## System prompts (literais)

Em `src/lib/distribuicao/prompts.ts`. Placeholders `{{...}}` são substituídos por `renderAnalysisPrompt(ctx)` / `renderChatPrompt(ctx)`.

### `renderAnalysisPrompt(ctx)`

```
Você é o FinDist, um assistente educacional especializado em explicar a distribuição de uma carteira de investimentos de forma didática, em português brasileiro.

CONTEXTO DO USUÁRIO
Perfil do investidor: {{profileLabel}}
Total investido: R$ {{totalBrl}}
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
5. Disclaimer final: "Estas são referências educacionais. Decisões de investimento devem considerar seu contexto pessoal e, se possível, orientação profissional."
```

### `renderChatPrompt(ctx)`

```
Você é o FinDist, assistente educacional sobre distribuição de carteira para investidores no Brasil.

CONTEXTO PERSISTENTE
Perfil do investidor: {{profileLabel}}
Total investido: R$ {{totalBrl}}
Distribuição atual: {{currentJson}}
Distribuição de referência para o perfil: {{targetJson}}

DIRETRIZES
- Responda em português brasileiro, didático e direto.
- Se a pergunta foge de finanças/distribuição/educação financeira, recuse cordialmente e ofereça trazer de volta ao tema.
- NUNCA recomende tickers ou produtos específicos. Sem PETR4, sem "CDB do Banco X".
- NUNCA prometa retorno ou garanta resultado.
- Quando relevante, ancore a resposta na distribuição do usuário (use os números do contexto acima).
- Respostas: 2 a 6 parágrafos curtos. Listas tudo bem com moderação.
```

---

## Caching do diagnóstico

**Problema:** sem cache, cada refresh da página gera nova chamada à Gemini — custo desnecessário e UX inconsistente (texto muda a cada refresh).

**Solução escolhida (simples, sem schema novo):** cache client-side em `localStorage`, lookup antes de iniciar o stream.

- **Chave:** `finwise:distribuicao-analysis:{userId}:{profile}:{hash(currentDistribution)}` — onde o hash é SHA-256 (ou djb2) das entradas ordenadas `[bucket, percentage]`.
- **Valor:** `{ content: string, cachedAt: ISOString }`.
- **TTL:** 24h. Após esse prazo o cache é descartado.
- **Fluxo no `diagnosis-panel.tsx`:**
  1. Ao montar, computa a chave a partir de props (`userId`, `profile`, `current`).
  2. Lê `localStorage`. Se hit válido → renderiza direto, sem chamar API.
  3. Se miss → POST `/api/ai/distribuicao-analysis`, streama na tela, ao final salva em `localStorage`.
  4. Botão "Re-analisar" invalida a entrada e força nova geração (útil pra ver outro texto).
- **Invalidação implícita:** mudar perfil → outra chave (sem invalidar a anterior, fica no histórico). Adicionar/remover ativos → `currentDistribution` muda → hash muda → outra chave → re-gera.

**Não escolhido (e por quê):**
- *Tabela `diagnosis_cache` no banco:* adicionaria schema novo + invalidação manual, sem ganho real pra projeto acadêmico sem cross-device sync.
- *`unstable_cache` do Next.js:* não combina bem com `streamText` (cache espera valor finito; streams não são serializáveis nativamente).

Para o chat **não há cache** — cada turno depende do histórico e da pergunta nova.

---

## UI components

### `profile-selector.tsx`

- Dois `Card`s lado a lado, ícones (lucide: `Sprout` / `TrendingUp`)
- Hover destaca, click chama server action e re-renderiza (revalidate cuida)
- Loading state durante submit (disabled + spinner)

### `distribution-donuts.tsx`

- Dois `EvilPieChart` em grid (md:grid-cols-2), cada um com `Pie innerRadius={60}` para virar donut, `Tooltip` e `Legend isClickable`
- Cores consumidas de `BUCKET_COLORS` (`lib/distribuicao/colors.ts`) — paleta única compartilhada com o delta chart. Mapeada pra `chartConfig` (formato `{ [bucket]: { label, colors: { light, dark } } }`)
- Centro do donut Atual mostra o total investido formatado em BRL; centro do donut Recomendada mostra apenas a label "Recomendada"
- Glow nos sectors mais expressivos (>30%) via prop `glowingSectors`
- Loading state nativo (`isLoading`) usado enquanto perfil não carregou
- `aria-label` em cada chart descrevendo o conteúdo ("Distribuição atual: X% em Ação, Y% em FII…") para leitores de tela

### `distribution-delta.tsx`

- shadcn `BarChart` horizontal (categorias no Y, delta no X), wrapper `ChartContainer`
- Cada barra colorida por sinal do delta: vermelho (`hsl(var(--destructive))`) se `atual − alvo < −2pp`, verde (`hsl(142 71% 45%)`) se `> +2pp`, cinza (`hsl(var(--muted-foreground))`) se entre −2pp e +2pp
- **Acessibilidade (não depende só de cor):** label no fim da barra mostra ícone `ArrowDown` (sub-alocado) ou `ArrowUp` (super-alocado) ou `Minus` (neutro) seguido do delta com sinal explícito (`+3pp`, `-7pp`, `0pp`)
- Eixo X com referência em 0 destacada
- Tooltip via shadcn `ChartTooltip` mostra: categoria, atual %, alvo %, delta
- Consome cores via `BUCKET_COLORS` de `lib/distribuicao/colors.ts` (mesma paleta dos donuts)

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
- **Bound de histórico:** envia ao servidor apenas as últimas 10 turns (último user+assistant pair × 5). Resto fica só na UI. Evita crescimento ilimitado de prompt size
- **Reset ao trocar perfil:** quando a prop `profile` muda (vinda do client orquestrador), useEffect limpa `messages` e re-mostra os chips de perguntas-sugestão. Justificativa: contexto antigo das respostas vira stale assim que o alvo de referência muda

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
- Cache server-side / cross-device do diagnóstico (só client-side localStorage com TTL)
- Mais perfis (conservador, agressivo, sofisticado)
- Recomendações específicas de tickers ou produtos
- Integração com dados de mercado em tempo real
- Goal-based planning, projeção de retorno, simulação Monte Carlo
- Rate limiting nas rotas AI
- Internacionalização (PT-BR only)

---

## Risks

- **IA gerar conselho irrealista ou perigoso** → mitigado por system prompt rígido, distribuição-referência hardcoded, disclaimer no UI, proibição explícita de tickers
- **Custo de AI escalar com chat** → modelo Gemini Flash Lite (já barato), `maxOutputTokens` limitado, sem persistência de histórico longo, bound de 10 turns enviadas ao servidor por mensagem
- **Diagnóstico re-gerado em cada page load** → mitigado por cache localStorage com chave determinística sobre o estado da carteira; TTL 24h
- **Distribuição-referência ser opinativa** → documentado como "referência educacional"; valores podem ser revisados sem mudar arquitetura
- **Better-auth typing drift** → manter `additionalFields` e `inferAdditionalFields<typeof auth>()` em sincronia; teste manual: após migration, verificar que `session.user.investorProfile` aparece tipado no client

---

## Follow-ups (anotados, fora desta entrega)

- PG enum ou `CHECK constraint` para `investor_profile` em vez de `text` cru
- Rate limiting nas rotas AI (provavelmente via middleware ou edge-config)
- Persistência de histórico de chat por usuário
- Mais perfis (conservador, agressivo, sofisticado)
- Cache cross-device do diagnóstico (tabela no banco)
- Validação na criação de `asset.type` para restringir a buckets conhecidos
