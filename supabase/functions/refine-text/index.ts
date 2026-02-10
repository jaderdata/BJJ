import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore: Deno runtime uses URL imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'No text provided' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Aqui você chamaria sua API de preferência (OpenAI, Gemini, etc.)
        // Exemplo com o modelo do Google Gemini (gratuito e poderoso):
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        let refinedText = text;

        if (GEMINI_API_KEY) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Você é um Assistente Executivo de Alto Padrão especializado em transcrição de visitas comerciais.
Sua tarefa é transformar a transcrição bruta abaixo em um RESUMO PROFISSIONAL, COESO e BEM PONTUADO.

Regras de Ouro:
1. Remova vícios de linguagem (tipo, aí, então, né, hum, etc).
2. Organize o texto em um parágrafo profissional ou tópicos se necessário.
3. Use pontuação e acentuação impecáveis.
4. Mantenha o tom formal, mas direto.
5. Se a conversa for longa, foque em extrair os pontos principais (Resumo Executivo).

Texto bruto: "${text}"

Retorne APENAS o texto refinado final, pronto para ser lido por um diretor.`
                        }]
                    }]
                })
            });

            const data = await response.json();
            refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
        } else {
            // Fallback simples se não houver chave de API configurada
            refinedText = text.trim();
            refinedText = refinedText.charAt(0).toUpperCase() + refinedText.slice(1);
            if (!/[.!?]$/.test(refinedText)) refinedText += '.';
        }

        return new Response(JSON.stringify({ refinedText: refinedText.trim() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
