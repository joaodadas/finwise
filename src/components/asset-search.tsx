"use client"

import { useState } from "react";
import { searchAssetsWithAI } from "@/app/actions/search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

export function AssetSearch() {
    // Estados para controlar a query, resultados, filtros ativos e loading
  const [query, setQuery] = useState(""); 
  const [results, setResults] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  //Previne reload, envia o texto natural para o backend, recebe os resultados e filtros aplicados, e atualiza os estados
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await searchAssetsWithAI(query);
      setResults(response.results);
      setActiveFilters(response.appliedFilters);
    } catch (error) {
      console.error("Erro na busca", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
        {/* Captura o que o usuário digita e desabilita o botão enquanto carrega */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input 
          placeholder="Ex: Ações de tecnologia com yield acima de 5%..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent border-[#2A2A2A] text-white"
        />
        <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-gray-200">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Pesquisar
        </Button>
      </form>
        {/* Mostra as tags que a IA aplicou como filtros */}
      {activeFilters && (
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <span>IA filtrou por:</span>
          {Object.entries(activeFilters).map(([key, value]) => (
            value ? <Badge key={key} variant="secondary" className="bg-[#1E1E1E] text-white border-[#2A2A2A]">{key}: {value as string}</Badge> : null
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lista os resultados da busca  e cria cards para cada um */}
        {results.map((item) => (
          <Card key={item.id} className="bg-[#121212] border-[#2A2A2A] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-base">
                <span>{item.name}</span>
                <Badge variant="outline" className="border-[#2A2A2A] text-gray-300">{item.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-400">
                <p>Quantidade: {item.quantity}</p>
                <p className="font-medium text-green-400 mt-1">
                  Preço Médio: R$ {item.averagePrice || item.average_price}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {/*  Mensagem de sucesso na busca mas banco vazio  */}
        {results.length === 0 && !loading && activeFilters && (
          <p className="text-gray-400 col-span-full text-center py-8">
            Nenhum ativo encontrado com esses critérios.
          </p>
        )}
      </div>
    </div>
  );
}