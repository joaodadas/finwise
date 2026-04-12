import { getAssets } from '@/app/actions/assets'
import { AssetsClient } from './client'

export default async function AtivosPage() {
  const assets = await getAssets()
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Meus Ativos</h1>
      <p className="text-muted-foreground">Gerencie sua carteira de investimentos.</p>
      
      <AssetsClient initialAssets={assets} />
    </div>
  )
}
