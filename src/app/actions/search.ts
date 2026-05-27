"use server"

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { db } from "@/db";
import { asset } from "@/db/schema"; 
import { and, ilike } from "drizzle-orm"; 

export async function searchAssetsWithAI(userQuery: string) {
  const { object: filters } = await generateObject({
    model: google('gemini-2.5-flash'),
    temperature: 0,
    system: "Você é um assistente financeiro especializado do FinWise. Sua tarefa é extrair filtros precisos para busca em banco de dados.\n\n" +
            "REGRAS PARA O CAMPO 'type':\n" +
            "Classifique a categoria do ativo usando EXATAMENTE um dos seguintes termos:\n" +
            "- 'Ação' (ex: papéis da bolsa, empresas)\n" +
            "- 'FII' (Mapeie termos como: fundo imobiliário)\n" +
            "- 'Renda Fixa' (Mapeie termos como: cdb, tesouro direto, selic)\n" +
            "- 'Cripto' (Mapeie termos como: criptomoeda, bitcoin, btc, eth, tokens)\n\n" +
            "REGRAS PARA O CAMPO 'keyword':\n" +
            "- Se o usuário citar uma empresa ou moeda, converta para a Sigla/Ticker (ex: 'Bitcoin' vira 'BTC', 'Weg' vira 'WEGE3').",
    prompt: userQuery,
    schema: z.object({
      type: z.string().optional().describe("Categoria do ativo (Ação, FII, Renda Fixa ou Cripto)"),
      keyword: z.string().optional().describe("Ticker ou palavra-chave (ex: WEGE3, BTC)"),
    })
  });

  const conditions = [];
  
  if (filters.type) {
    conditions.push(ilike(asset.type, `%${filters.type}%`));
  }
  
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