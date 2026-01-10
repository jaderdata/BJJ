-- CORREÇÃO DEFINITIVA DO REALTIME
-- Execute estes comandos na ordem no SQL Editor do Supabase

-- 1. Verificar se a tabela está na publicação
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 2. ADICIONAR a tabela notifications à publicação Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Verificar novamente se foi adicionada
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';

-- Se retornar 'notifications', está correto! ✅

-- 4. TESTE: Agora execute este INSERT (com o sistema aberto no navegador)
INSERT INTO notifications (user_id, message, read)
VALUES ('215d05a8-3f06-4bac-a929-d2dd9056f9bb', 'TESTE após habilitar Realtime - ' || NOW(), false);

-- IMPORTANTE: Depois de executar o comando 2 (ALTER PUBLICATION), 
-- você pode precisar fazer LOGOUT e LOGIN novamente no sistema
-- para que a conexão Realtime seja reestabelecida com a nova configuração.
