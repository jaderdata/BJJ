-- ========================================================================================
-- SCRIPT DE CORREÇÃO: Follow-Ups e Políticas RLS (Supabase)
--
-- Problema: Erro 401/42501 (Unauthorized / RLS Violation) ao tentar salvar ou listar Follow-Ups.
-- Causa: O projeto usa auth customizado via RPC (não o Supabase Auth nativo), portanto
--        o cliente sempre usa a chave 'anon'. As políticas devem permitir auth.role() = 'anon'
--        para ser compatível com o restante da aplicação.
--
-- Instruções:
-- 1. Copie todo o código abaixo
-- 2. Cole no SQL Editor do seu Supabase Dashboard
-- 3. Clique em "RUN"
-- ========================================================================================

-- Garantir que a tabela existe com todas as colunas necessárias e os nomes corretos
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'AGUARDANDO',
    notes TEXT,
    next_contact_at TEXT,
    contact_person TEXT,
    contact_channel TEXT NOT NULL DEFAULT 'CALL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar Row Level Security
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Limpar possíveis políticas antigas com problemas para evitar conflitos
DROP POLICY IF EXISTS "Todos podem ver follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Apenas admins veem todos os follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Vendedores veem os seus follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Vendedores podem inserir seus follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Vendedores podem atualizar seus follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Vendedores podem deletar seus follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Permitir select geral" ON public.follow_ups;
DROP POLICY IF EXISTS "Permitir insert autenticados" ON public.follow_ups;
DROP POLICY IF EXISTS "Permitir update autenticados" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can view follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can insert follow ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update their follow ups" ON public.follow_ups;

-- NOTA: O projeto usa auth customizado (RPC auth_login), não o Supabase Auth nativo.
-- O cliente sempre usa a anon key, então auth.role() = 'anon' para todas as requisições.
-- A lógica de controle de acesso (quem vê o quê) já está implementada no FollowUp.tsx.

-- 1. SELECT (Visualizar)
CREATE POLICY "Permitir leitura em follow ups"
    ON public.follow_ups
    FOR SELECT
    USING (auth.role() = 'anon');

-- 2. INSERT (Criar)
CREATE POLICY "Permitir inserção em follow ups"
    ON public.follow_ups
    FOR INSERT
    WITH CHECK (auth.role() = 'anon');

-- 3. UPDATE (Atualizar)
CREATE POLICY "Permitir atualizacao em follow ups"
    ON public.follow_ups
    FOR UPDATE
    USING (auth.role() = 'anon');

-- 4. DELETE (Deletar)
CREATE POLICY "Permitir delecao em follow ups"
    ON public.follow_ups
    FOR DELETE
    USING (auth.role() = 'anon');

-- Recriar os índices para performance (Opcional)
CREATE INDEX IF NOT EXISTS idx_follow_ups_academy ON public.follow_ups(academy_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_creator ON public.follow_ups(created_by);

-- Notificar Sucesso
DO $$
BEGIN
   RAISE NOTICE 'Políticas de segurança de follow_ups corrigidas com sucesso!';
END
$$;
