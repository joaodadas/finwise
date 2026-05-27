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
      return Response.json(
        { error: 'Perfil de investidor não definido.' },
        { status: 400 },
      )
    }
    if (ctx.totalInvested === 0) {
      return Response.json(
        { error: 'Carteira vazia — adicione ativos para iniciar o chat.' },
        { status: 400 },
      )
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
