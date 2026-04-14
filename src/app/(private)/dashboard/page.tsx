import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAssets } from "@/app/actions/assets"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Wallet, PieChart, TrendingUp, ArrowRight, Activity, DollarSign, Briefcase } from 'lucide-react'

export default async function DashboardPage() {
  const assets = await getAssets()
  const totalAssetsCount = assets.length

  const totalInvested = assets.reduce((acc, asset) => {
    return acc + (parseFloat(asset.quantity) * parseFloat(asset.averagePrice));
  }, 0);

  // Group by type
  const distByType = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + (parseFloat(asset.quantity) * parseFloat(asset.averagePrice));
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 w-full max-w-7xl mx-auto dark:bg-background">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Minha Carteira</h1>
          <p className="text-muted-foreground mt-2 text-lg">Acompanhe a evolução do seu patrimônio e performance.</p>
        </div>
        <Link href="/dashboard/ativos">
          <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <Activity className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            Gerenciar Ativos
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Value Card */}
        <Card className="relative overflow-hidden group hover:border-primary/50 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground relative z-10">Patrimônio Total</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
            </div>
            <p className="text-sm text-emerald-500 flex items-center mt-2 font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +0.00% desde o último mês (Simulado)
            </p>
          </CardContent>
        </Card>

        {/* Quantidade de Ativos Card */}
        <Card className="hover:border-blue-500/50 transition-colors duration-300 group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <Briefcase className="w-32 h-32" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tipos de Ativos</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <PieChart className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight">{Object.keys(distByType).length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Diferentes categorias logadas
            </p>
          </CardContent>
        </Card>

        {/* Quantidade Total de Ativos Card */}
        <Card className="hover:border-purple-500/50 transition-colors duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Ativos</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Wallet className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{totalAssetsCount}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Ativos cadastrados na carteira
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recentes / Detalhes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-1 lg:col-span-4 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Movimentações Recentes</CardTitle>
            <CardDescription>Você tem {assets.length} ativos adicionados ao total.</CardDescription>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-lg border border-dashed border-muted mt-2">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Nenhum ativo encontrado</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-4">Você ainda não tem ativos cadastrados. Comece agora para acompanhar sua carteira e gerenciar seus investimentos.</p>
                <Link href="/dashboard/ativos">
                  <Button variant="outline" className="group">
                    Adicionar Primeiro Ativo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between group p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shadow-sm">
                        {asset.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{asset.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{asset.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(asset.averagePrice))}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Qtd: {asset.quantity}
                      </div>
                    </div>
                  </div>
                ))}
                {assets.length > 5 && (
                  <div className="pt-2">
                    <Link href="/dashboard/ativos">
                      <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-primary">
                        Ver todos os {assets.length} ativos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Distribuição</CardTitle>
            <CardDescription>Seus ativos por categoria de investimento</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Object.keys(distByType).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm bg-muted/10 rounded-lg border border-dashed border-muted">
                <PieChart className="h-8 w-8 mb-2 opacity-20" />
                Sem dados disponíveis
              </div>
            ) : (
              <div className="space-y-5 mt-2">
                {Object.entries(distByType).sort((a, b) => b[1] - a[1]).map(([type, value]) => {
                  const percentage = ((value / totalInvested) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex flex-col gap-2 relative">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium text-foreground/80">{type}</span>
                        <span className="text-muted-foreground font-semibold">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

