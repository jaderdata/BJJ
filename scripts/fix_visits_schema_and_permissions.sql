-- FIX CRÍTICO: Adicionar colunas faltantes e corrigir permissões

-- 1. Adicionar coluna 'summary' (TEXT)
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- 2. Adicionar coluna 'updated_at' (TIMESTAMP)
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Resetar permissões RLS para garantir que nada bloqueie
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all visits" ON public.visits;
CREATE POLICY "Allow all visits" ON public.visits FOR ALL USING (true) WITH CHECK (true);

-- 4. Garantir permissões de acesso para roles do Supabase
GRANT ALL ON public.visits TO anon;
GRANT ALL ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
