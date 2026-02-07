-- FIX CRÍTICO: Adicionar colunas faltantes e garantir permissões da tabela 'visits'

-- 1. Adicionar colunas caso não existam (Evita erro 400 Bad Request)
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Garantir que as permissões de acesso estão corretas (Reset de RLS)
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Allow all visits" ON public.visits;
DROP POLICY IF EXISTS "public_access" ON public.visits;

-- Cria uma política de acesso total (Leitura e Escrita)
CREATE POLICY "Allow all visits" 
ON public.visits 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Conceder permissões explícitas às roles
GRANT ALL ON public.visits TO anon;
GRANT ALL ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;

-- 4. Notificar sucesso no log do Supabase
SELECT '✅ Schema e Permissões da tabela visits atualizados com sucesso!' as status;
