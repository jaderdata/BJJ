-- Adicionar coluna contact_person à tabela visits
-- Este script adiciona a coluna que armazena com quem foi a conversa durante a visita

-- Adicionar a coluna contact_person se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'visits' 
        AND column_name = 'contact_person'
    ) THEN
        ALTER TABLE visits 
        ADD COLUMN contact_person TEXT;
        
        COMMENT ON COLUMN visits.contact_person IS 'Com quem foi a conversa durante a visita (Dono, Professor, Funcionário, Ninguém disponível)';
    END IF;
END $$;
