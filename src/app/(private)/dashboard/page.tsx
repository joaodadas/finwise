import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAssets } from "@/app/actions/assets"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const assets = await getAssets()
  const totalAssets = assets.length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meus Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground pt-1">
              Ativos na carteira
            </p>
            <div className="mt-4">
              <Link href="/dashboard/ativos">
                <Button variant="outline" className="w-full">
                  Gerenciar Ativos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
