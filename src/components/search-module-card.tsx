// input para pesquisa usando IA, que chama a função de busca no backend e mostra os resultados em cards
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { AssetSearch } from "@/components/asset-search"; 

export function SearchModuleCard() {
  return (
    // Dialog engloba o componente para gerenciar o estado de abrir/fechar do modal  
    <Dialog>
        {/* Interface do Card */}
      <Card className="bg-[#121212] border-[#2A2A2A] flex flex-col justify-between hover:border-[#3A3A3A] transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Explorar Ativos
          </CardTitle>
          <Sparkles className="h-4 w-4 text-blue-400" />
        </CardHeader>
        
        <CardContent className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-white" />
            <h3 className="text-xl font-bold text-white">Pesquisa Inteligente</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Encontre ativos usando filtros de IA em linguagem natural.
          </p>
        </CardContent>

        <CardFooter>
          {/* Botão para o Dialog abrir o DialogContent na tela atual */}
          <DialogTrigger 
            className="w-full inline-flex h-10 items-center justify-between whitespace-nowrap rounded-md border border-[#2A2A2A] bg-transparent px-4 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-[#1E1E1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Nova Busca <ArrowRight className="h-4 w-4 ml-2 opacity-70" />
          </DialogTrigger>
        </CardFooter>
      </Card>

        {/* Conteúdo do modal que aparece ao clicar no botão, quando ativa cria um overlay na tela e renderiza a busca. */}
      <DialogContent className="sm:max-w-3xl bg-[#121212] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Pesquisa Inteligente de Ativos</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Descreva o que você procura. Ex: "Ações do setor de energia com yield maior que 5%"
          </DialogDescription>
        </DialogHeader>
        
        {/* se a busca retornar varios itens, o modal cria uma barra de rolagem interna e não quebra o layout */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <AssetSearch />
        </div>
      </DialogContent>
    </Dialog>
  );
}