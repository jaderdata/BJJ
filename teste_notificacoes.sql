-- TESTE RÁPIDO DE NOTIFICAÇÕES
-- Execute este script no SQL Editor do Supabase
-- Dashboard: https://supabase.com/dashboard/project/zdtkjfljiugjvixiarka/sql

-- 1. Verificar se a tabela notifications existe
SELECT 'Tabela notifications existe' as status, count(*) as total_notificacoes
FROM notifications;

-- 2. Verificar se Realtime está habilitado
SELECT 
  'Realtime configurado' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'notifications'
    ) THEN 'SIM ✅'
    ELSE 'NÃO ❌ - Execute: ALTER PUBLICATION supabase_realtime ADD TABLE notifications;'
  END as realtime_habilitado;

-- 3. Verificar políticas RLS
SELECT 
  'Políticas RLS' as status,
  count(*) as total_politicas,
  CASE 
    WHEN count(*) >= 3 THEN 'OK ✅'
    ELSE 'FALTANDO ❌ - Execute o script enable_realtime.sql'
  END as resultado
FROM pg_policies 
WHERE tablename = 'notifications';

-- 4. Listar todas as políticas
SELECT 
  policyname as politica,
  cmd as comando,
  qual as condicao
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. Verificar estrutura da tabela notifications
SELECT 
  column_name as coluna,
  data_type as tipo,
  is_nullable as permite_null
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela profiles
SELECT 
  column_name as coluna,
  data_type as tipo
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 7. Últimas 5 notificações criadas
SELECT 
  n.id,
  n.user_id,
  p.name as usuario,
  p.role as papel,
  n.message as mensagem,
  n.read as lida,
  n.created_at as criada_em
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 5;

-- 8. Listar todos os usuários (para pegar o user_id)
SELECT 
  id as user_id,
  name as nome,
  role as papel
FROM profiles
ORDER BY name;

-- 9. TESTE FINAL: Criar uma notificação de teste
-- IMPORTANTE: Substitua 'SEU_USER_ID_AQUI' pelo seu user_id real da query acima

-- INSERT INTO notifications (user_id, message, read)
-- VALUES ('SEU_USER_ID_AQUI', 'Teste de notificação - ' || NOW(), false);

-- Se a notificação acima aparecer instantaneamente na tela, o Realtime está funcionando! ✅
