-- 🚨 SCRIPT DE CORREÇÃO DEFINITIVA - TABELA 'VISITS'

-- 1. ADICIONAR COLUNAS FALTANTES (Resolve Erro 400 Bad Request)
-- O Postgres ignora se a coluna já existir graças ao IF NOT EXISTS.
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. RESET DE PERMISSÕES (Row Level Security)
-- Garante que o app possa ler e escrever sem bloqueios.
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all visits" ON public.visits;
DROP POLICY IF EXISTS "public_access" ON public.visits;

CREATE POLICY "Allow all visits" 
ON public.visits 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. GARANTIR ACESSO AOS USUÁRIOS (Anon e Autenticados)
GRANT ALL ON public.visits TO anon;
GRANT ALL ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;

-- Log de confirmação
SELECT '✅ Tabela visits atualizada com sucesso!' as status;
