'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAsset, updateAsset, deleteAsset } from '@/app/actions/assets'

type Asset = {
  id: string
  name: string
  type: string
  quantity: string
  averagePrice: string
}

export function AssetsClient({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Ação',
    quantity: '',
    averagePrice: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      await updateAsset(editingId, formData)
      setAssets(assets.map(a => a.id === editingId ? { ...a, ...formData } : a))
      setEditingId(null)
    } else {
      const newId = await createAsset(formData)
      setAssets([...assets, { id: newId, ...formData }])
    }
    
    setFormData({ name: '', type: 'Ação', quantity: '', averagePrice: '' })
  }

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id)
    setFormData({
      name: asset.name,
      type: asset.type,
      quantity: asset.quantity,
      averagePrice: asset.averagePrice,
    })
  }

  const handleDelete = async (id: string) => {
    await deleteAsset(id)
    setAssets(assets.filter(a => a.id !== id))
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Adicionar'} Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome/Ticker (ex: PETR4)</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <select 
                  id="type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Ação">Ação</option>
                  <option value="FII">FII</option>
                  <option value="Renda Fixa">Renda Fixa (CDB/Tesouro)</option>
                  <option value="Cripto">Criptomoeda</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  step="0.001" 
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averagePrice">Preço Médio (R$)</Label>
                <Input 
                  id="averagePrice" 
                  type="number" 
                  step="0.01" 
                  value={formData.averagePrice} 
                  onChange={e => setFormData({...formData, averagePrice: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="w-full">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                {editingId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setEditingId(null)
                      setFormData({ name: '', type: 'Ação', quantity: '', averagePrice: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Meus Ativos ({assets.length})</h2>
        
        {assets.length === 0 ? (
          <p className="text-muted-foreground">Nenhum ativo cadastrado.</p>
        ) : (
          <div className="grid gap-4">
            {assets.map(asset => (
              <Card key={asset.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">{asset.type}</p>
                    <div className="text-sm mt-1">
                      <span>Qtd: {asset.quantity}</span> | <span>PM: R$ {asset.averagePrice}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(asset)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(asset.id)}>Excluir</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
