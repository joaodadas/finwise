'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import type { DistributionMap, InvestorProfile } from '@/lib/distribuicao/types'

const CACHE_VERSION = 1
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

type CacheEntry = { v: number; content: string; cachedAt: string }

function hashDistribution(d: DistributionMap): string {
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
    // quota cheia / disabled — ignore
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

  const fetchAnalysis = useCallback(
    async (forceRefresh = false) => {
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
          const errJson = (await res.json().catch(() => ({}))) as { error?: string }
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
    },
    [key],
  )

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
        <Button variant="ghost" size="sm" disabled={streaming} onClick={() => fetchAnalysis(true)}>
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
