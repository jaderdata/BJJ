-- Adicionar colunas para rastreamento de materiais de marketing
ALTER TABLE visits ADD COLUMN IF NOT EXISTS left_banner boolean DEFAULT false;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS left_flyers boolean DEFAULT false;
