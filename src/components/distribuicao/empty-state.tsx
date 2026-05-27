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
