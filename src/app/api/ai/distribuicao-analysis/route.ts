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
      return Response.json(
        { error: 'Perfil de investidor não definido.' },
        { status: 400 },
      )
    }
    if (ctx.totalInvested === 0) {
      return Response.json(
        { error: 'Carteira vazia — adicione ativos antes de gerar análise.' },
        { status: 400 },
      )
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
