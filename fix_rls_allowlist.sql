-- ✅ VERIFICAÇÃO E CORREÇÃO: Políticas RLS para app_allowlist

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'app_allowlist';

-- 2. Se RLS estiver habilitado, criar políticas necessárias

-- Política para SELECT (leitura)
CREATE POLICY "Allow authenticated users to read allowlist"
ON app_allowlist
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE (atualização de status)
CREATE POLICY "Allow authenticated users to update allowlist"
ON app_allowlist
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para INSERT (adicionar novos usuários)
CREATE POLICY "Allow authenticated users to insert allowlist"
ON app_allowlist
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. OU desabilitar RLS temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)
-- ALTER TABLE app_allowlist DISABLE ROW LEVEL SECURITY;

-- 4. Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'app_allowlist';
