-- REVERTER TODAS AS MUDANÇAS DE RLS
-- Este script remove as políticas restritivas e restaura o acesso amplo

-- ========================================
-- VISITS
-- ========================================
DROP POLICY IF EXISTS "Authenticated view all visits" ON public.visits;
DROP POLICY IF EXISTS "Admin view all visits" ON public.visits;
DROP POLICY IF EXISTS "Admin manage visits" ON public.visits;
DROP POLICY IF EXISTS "Salesperson view own visits" ON public.visits;
DROP POLICY IF EXISTS "Salesperson insert own visits" ON public.visits;
DROP POLICY IF EXISTS "Salesperson update own visits" ON public.visits;
DROP POLICY IF EXISTS "Salesperson delete own visits" ON public.visits;

-- Criar política permissiva para todos os usuários autenticados
CREATE POLICY "Authenticated manage all visits" ON public.visits 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- ========================================
-- FINANCE_RECORDS
-- ========================================
DROP POLICY IF EXISTS "Authenticated view all finance" ON public.finance_records;
DROP POLICY IF EXISTS "Admin view all finance" ON public.finance_records;
DROP POLICY IF EXISTS "Admin manage finance" ON public.finance_records;
DROP POLICY IF EXISTS "Service role manage finance" ON public.finance_records;

-- Criar política permissiva para todos os usuários autenticados
CREATE POLICY "Authenticated manage all finance" ON public.finance_records 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- ========================================
-- ACADEMIES
-- ========================================
-- Manter as políticas de academies como estão (já funcionam)

-- ========================================
-- EVENTS
-- ========================================
-- Manter as políticas de events como estão (já funcionam)

-- ========================================
-- VOUCHERS
-- ========================================
DROP POLICY IF EXISTS "Authenticated manage vouchers" ON public.vouchers;

CREATE POLICY "Authenticated manage all vouchers" ON public.vouchers 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);
