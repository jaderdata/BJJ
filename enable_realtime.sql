-- Script para habilitar Realtime na tabela notifications
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a tabela existe
SELECT tablename FROM pg_tables WHERE tablename = 'notifications';

-- 2. Habilitar Realtime para a tabela notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Verificar se foi adicionado com sucesso
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';

-- 4. Verificar as políticas RLS (Row Level Security)
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- 5. Se necessário, criar as políticas RLS
-- Política para SELECT (usuários podem ver suas próprias notificações)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Política para INSERT (qualquer usuário autenticado pode criar notificações)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE (usuários podem atualizar suas próprias notificações)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- 6. Garantir que RLS está habilitado
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 7. Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;
