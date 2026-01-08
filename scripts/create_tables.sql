-- BJJVisits - Database Schema Extensions
-- Execute este script no SQL Editor do Supabase

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies para Notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins podem criar notificações para qualquer usuário
CREATE POLICY "Admins can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Tabela de Logs do Sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- RLS Policies para System Logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Todos podem criar logs
CREATE POLICY "Anyone can create logs"
    ON system_logs FOR INSERT
    WITH CHECK (true);

-- Apenas admins podem visualizar logs (ajuste conforme sua lógica de roles)
CREATE POLICY "Admins can view all logs"
    ON system_logs FOR SELECT
    USING (true);

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Armazena notificações para usuários do sistema';
COMMENT ON TABLE system_logs IS 'Armazena logs de atividades do sistema para auditoria';

COMMENT ON COLUMN notifications.user_id IS 'ID do usuário que receberá a notificação';
COMMENT ON COLUMN notifications.message IS 'Mensagem da notificação';
COMMENT ON COLUMN notifications.read IS 'Indica se a notificação foi lida';

COMMENT ON COLUMN system_logs.user_id IS 'ID do usuário que executou a ação';
COMMENT ON COLUMN system_logs.user_name IS 'Nome do usuário no momento da ação';
COMMENT ON COLUMN system_logs.action IS 'Tipo de ação executada';
COMMENT ON COLUMN system_logs.details IS 'Detalhes adicionais sobre a ação';
