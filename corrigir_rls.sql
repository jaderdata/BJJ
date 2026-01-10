-- CORREÇÃO DAS POLÍTICAS RLS PARA NOTIFICAÇÕES
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- 2. Criar políticas corretas
-- Política para SELECT (usuários podem ver suas próprias notificações)
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT 
  USING (user_id = auth.uid());

-- Política para INSERT (qualquer usuário autenticado pode criar notificações)
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT 
  WITH CHECK (true);

-- Política para UPDATE (usuários podem atualizar suas próprias notificações)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE 
  USING (user_id = auth.uid());

-- 3. Garantir que RLS está habilitado
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Verificar as políticas criadas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. TESTE: Inserir uma notificação
-- (Execute com o sistema aberto e logado)
INSERT INTO notifications (user_id, message, read)
VALUES ('215d05a8-3f06-4bac-a929-d2dd9056f9bb', 'TESTE COM RLS CORRIGIDO - ' || NOW(), false);
