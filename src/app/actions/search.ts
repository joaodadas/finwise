"use server"

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { db } from "@/db";
import { asset } from "@/db/schema"; 
import { and, ilike } from "drizzle-orm"; // <-- Note que removemos o 'eq' e vamos usar 'ilike' para tudo

export async function searchAssetsWithAI(userQuery: string) {
  const { object: filters } = await generateObject({
    model: google('gemini-2.5-flash'), 
    temperature: 0, 
    // Atualizamos o System Prompt para a IA converter Bitcoin em BTC, Weg em WEGE3, etc.
    system: "Você é um assistente financeiro. Extraia filtros para o banco de dados. Regras: 1) O campo 'type' deve ser a categoria em português (ex: Ação, Cripto, Renda Fixa). 2) Se o usuário buscar o nome de uma empresa ou criptomoeda conhecida, converta o 'keyword' para o seu Ticker/Sigla de mercado (ex: 'Bitcoin' vira 'BTC', 'Weg' vira 'WEGE3').",
    prompt: userQuery,
    schema: z.object({
      type: z.string().optional().describe("Categoria do ativo (Ação, Cripto, Renda Fixa)"),
      keyword: z.string().optional().describe("Ticker ou palavra-chave (ex: BTC, WEGE3)"),
    })
  });

  const conditions = [];
  
  // Usar 'ilike' resolve o problema do "Cripto" vs "cripto"
  if (filters.type) {
    conditions.push(ilike(asset.type, `%${filters.type}%`));
  }
  
  // Vai buscar por '%BTC%' e encontrar tanto 'BTC' quanto 'BTC-USD'
  if (filters.keyword) {
    conditions.push(ilike(asset.name, `%${filters.keyword}%`));
  }

  const results = await db
    .select()
    .from(asset)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(20);

  return { results, appliedFilters: filters };
}