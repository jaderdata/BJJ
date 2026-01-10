-- TESTE DE NOTIFICAÇÃO EM TEMPO REAL
-- Execute este comando DEPOIS de abrir o sistema no navegador e fazer login

-- PASSO 1: Abra o sistema no navegador e faça login como "jader dourado" (ADMIN)
-- PASSO 2: Abra o Console do navegador (F12)
-- PASSO 3: Execute este comando SQL no Supabase:

INSERT INTO notifications (user_id, message, read)
VALUES ('215d05a8-3f06-4bac-a929-d2dd9056f9bb', 'TESTE REALTIME - ' || NOW(), false);

-- RESULTADO ESPERADO:
-- Se o Realtime estiver funcionando, você verá:
-- 1. No console do navegador: "🔔 [Notifications] Received realtime notification: ..."
-- 2. Na tela: Uma notificação aparecerá no topo instantaneamente

-- Se NÃO aparecer, execute os comandos abaixo:

-- HABILITAR REALTIME:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Depois execute o INSERT novamente e veja se funciona.

-- TESTE ADICIONAL: Enviar notificação para um vendedor
-- (Faça login como "teste vendedor1" em outra aba/navegador)
INSERT INTO notifications (user_id, message, read)
VALUES ('48fc76bd-d912-469e-9c03-4a6360658472', 'TESTE para vendedor - ' || NOW(), false);
