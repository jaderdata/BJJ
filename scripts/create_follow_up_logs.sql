-- ========================================================================================
-- SCRIPT: Criação da tabela de log de atividades de Follow-Up
--
-- Finalidade: Registrar todas as ações feitas em cada follow-up (criação, mudança de
--             status, edição) com identificação do usuário responsável, permitindo
--             rastreabilidade total para trabalho em equipe.
--
-- Instruções:
-- 1. Copie todo o código abaixo
-- 2. Cole no SQL Editor do seu Supabase Dashboard
-- 3. Clique em "RUN"
-- ========================================================================================

CREATE TABLE IF NOT EXISTS public.follow_up_logs (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follow_up_id  UUID NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL,
    user_name     TEXT NOT NULL,
    action        TEXT NOT NULL, -- 'CRIADO' | 'STATUS_ALTERADO' | 'ATUALIZADO'
    from_status   TEXT,          -- status anterior (preenchido quando action = STATUS_ALTERADO)
    to_status     TEXT,          -- status novo    (preenchido quando action = STATUS_ALTERADO ou CRIADO)
    note          TEXT,          -- descrição livre do que foi alterado
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_follow_up_logs_follow_up ON public.follow_up_logs(follow_up_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_logs_created_at ON public.follow_up_logs(created_at DESC);

-- Row Level Security
ALTER TABLE public.follow_up_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura em follow up logs" ON public.follow_up_logs;
DROP POLICY IF EXISTS "Permitir inserção em follow up logs" ON public.follow_up_logs;

-- Apenas leitura e inserção — deleção só via CASCADE da tabela pai
CREATE POLICY "Permitir leitura em follow up logs"
    ON public.follow_up_logs FOR SELECT
    USING (auth.role() = 'anon');

CREATE POLICY "Permitir inserção em follow up logs"
    ON public.follow_up_logs FOR INSERT
    WITH CHECK (auth.role() = 'anon');

DO $$
BEGIN
   RAISE NOTICE 'Tabela follow_up_logs criada com sucesso!';
END
$$;
