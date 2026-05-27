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
        const err = (await res.json().catch(() => ({}))) as { error?: string }
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
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50"
                style={{ animationDelay: '0.3s' }}
              />
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
