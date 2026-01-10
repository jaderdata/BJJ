-- 🚀 HABILITAR REALTIME PARA TODAS AS TABELAS PRINCIPAIS
-- Execute este script no SQL Editor do Supabase para garantir que as mudanças do ADM
-- reflitam instantaneamente na tela do Vendedor.

-- 1. Garantir que a publicação para Realtime existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Adicionar todas as tabelas à publicação (se ainda não estiverem)
-- Nota: Se a tabela já estiver na publicação, o comando falha, por isso usamos segurança.

-- Remover e readicionar (forma mais garantida de atualizar)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    academies, 
    events, 
    event_academies, 
    visits, 
    vouchers, 
    finance_records, 
    notifications;

-- 3. Verificar status
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
