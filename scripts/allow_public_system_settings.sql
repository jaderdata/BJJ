-- Permitir acesso público de leitura à tabela system_settings
-- Isso é necessário para que a página pública de vouchers possa funcionar sem autenticação

-- Criar política de leitura pública para system_settings
DO $$ 
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_settings' 
        AND policyname = 'Public can read system_settings'
    ) THEN
        CREATE POLICY "Public can read system_settings"
            ON system_settings
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Garantir que RLS está habilitado
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Public can read system_settings" ON system_settings IS 
'Permite acesso público de leitura às configurações do sistema (necessário para página pública de vouchers)';
